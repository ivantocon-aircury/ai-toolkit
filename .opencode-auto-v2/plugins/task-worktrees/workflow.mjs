import { execFile } from "node:child_process"
import { constants } from "node:fs"
import { cp, lstat, open, readFile, readdir, realpath, rmdir, unlink } from "node:fs/promises"
import { homedir } from "node:os"
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path"
import { promisify } from "node:util"

const exec = promisify(execFile)

// A server can inherit repository-local Git state from its launcher. It must
// not redirect commands away from the explicitly selected inventory entry.
async function runGit(directory, args, signal) {
  const env = { ...process.env }
  for (const key of ["GIT_DIR", "GIT_WORK_TREE", "GIT_COMMON_DIR", "GIT_INDEX_FILE", "GIT_OBJECT_DIRECTORY", "GIT_ALTERNATE_OBJECT_DIRECTORIES", "GIT_IMPLICIT_WORK_TREE", "GIT_PREFIX", "GIT_SHALLOW_FILE", "GIT_GRAFT_FILE"]) {
    delete env[key]
  }
  return exec("git", ["-C", directory, ...args], { cwd: directory, env, signal })
}

async function exists(path) {
  try {
    return await lstat(path)
  } catch (error) {
    if (error.code === "ENOENT") return undefined
    throw error
  }
}

function isSameOrDescendant(parent, candidate) {
  const path = relative(parent, candidate)
  return path === "" || (!isAbsolute(path) && path !== ".." && !path.startsWith(`..${sep}`))
}

async function listEntries(directory, prefix = "") {
  const entries = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    const name = prefix ? join(prefix, entry.name) : entry.name
    entries.push(name)
    // Do not follow symlinks while checking or removing residue.
    if (entry.isDirectory() && !entry.isSymbolicLink()) {
      entries.push(...await listEntries(path, name))
    }
  }
  return entries
}

async function mountPoints() {
  try {
    const contents = await readFile("/proc/self/mountinfo", "utf8")
    return contents.split("\n").flatMap((line) => {
      const fields = line.split(" ")
      const separator = fields.indexOf("-")
      if (separator < 6) return []
      return [fields[4].replace(/\\([0-7]{3})/g, (_, octal) => String.fromCharCode(Number.parseInt(octal, 8)))]
    })
  } catch (error) {
    throw new Error(`Cannot inspect mount points: ${error.message}`)
  }
}

export async function assertNoMounts(directory) {
  const mounts = await mountPoints()
  if (mounts.some((mount) => isSameOrDescendant(directory, mount))) {
    throw new Error("A worktree target cannot be a mount point or contain a mount point.")
  }
}

async function assertNoNestedRepositories(directory, inventory) {
  for (const entry of inventory) {
    if (entry.directory !== directory && isSameOrDescendant(directory, entry.directory)) {
      throw new Error("A worktree target cannot contain another registered worktree.")
    }
  }
  const entries = await listEntries(directory)
  if (entries.some((entry) => entry !== ".git" && basename(entry) === ".git")) {
    throw new Error("A worktree target cannot contain a nested repository or submodule.")
  }
}

async function isIgnored(directory, entry) {
  try {
    await runGit(directory, ["check-ignore", "-q", "--", entry])
    return true
  } catch (error) {
    if (error.code === 1) return false
    throw new Error(`Cannot verify ignored residue ${entry}: ${error.message}`)
  }
}

async function ignoredResidueSnapshot(directory, discardAll = false) {
  const entries = (await listEntries(directory)).filter((entry) => entry !== ".git")
  const ignored = new Set()
  const kinds = new Map()
  for (const entry of entries) {
    const info = await lstat(join(directory, entry))
    kinds.set(entry, info.isDirectory() ? "directory" : info.isSymbolicLink() ? "symlink" : info.isFile() ? "file" : "other")
    if (discardAll || await isIgnored(directory, entry)) ignored.add(entry)
  }
  return { entries: new Set(entries), ignored, kinds }
}

async function removeVerifiedResidue(directory, snapshot) {
  const flags = constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW
  const targetInfo = await lstat(directory)
  const parent = await open(dirname(directory), flags)
  const handles = new Map()
  const via = (handle, name) => `/proc/self/fd/${handle.fd}/${name}`
  const kindOf = (info) => info.isDirectory() ? "directory" : info.isSymbolicLink() ? "symlink" : info.isFile() ? "file" : "other"
  try {
    const root = await open(via(parent, basename(directory)), flags)
    handles.set("", root)
    const rootInfo = await root.stat()
    if (rootInfo.dev !== targetInfo.dev || rootInfo.ino !== targetInfo.ino) {
      throw new Error("Residue target changed while opening its verified directory.")
    }
    const residue = await listEntries(`/proc/self/fd/${root.fd}`)
    const unexpected = []
    for (const entry of residue) {
      const info = await lstat(join(`/proc/self/fd/${root.fd}`, entry))
      const kind = kindOf(info)
      if (!snapshot.entries.has(entry) || !snapshot.ignored.has(entry) || snapshot.kinds.get(entry) !== kind) unexpected.push(entry)
    }
    if (unexpected.length) return unexpected

    for (const entry of residue.filter((item) => snapshot.kinds.get(item) === "directory").sort((left, right) => left.split(sep).length - right.split(sep).length)) {
      const parentEntry = dirname(entry)
      const parentHandle = handles.get(parentEntry === "." ? "" : parentEntry)
      const info = await lstat(via(parentHandle, basename(entry)))
      if (kindOf(info) !== "directory") throw new Error(`Residue changed while opening ${entry}.`)
      handles.set(entry, await open(via(parentHandle, basename(entry)), flags))
    }

    // Every destructive operation is descriptor-relative and no-follow. A
    // raced-in entry or mount leaves its parent non-empty instead of traversing
    // outside the verified target.
    for (const entry of residue.sort((left, right) => right.split(sep).length - left.split(sep).length)) {
      const parentEntry = dirname(entry)
      const parentHandle = handles.get(parentEntry === "." ? "" : parentEntry)
      const path = via(parentHandle, basename(entry))
      const info = await lstat(path)
      const kind = kindOf(info)
      if (snapshot.kinds.get(entry) !== kind) throw new Error(`Residue changed while removing ${entry}.`)
      await assertNoMounts(directory)
      if (kind === "directory") await rmdir(path)
      else if (kind === "file" || kind === "symlink") await unlink(path)
      else throw new Error(`Residue entry ${entry} is not a removable file, symlink, or directory.`)
    }
    const currentRoot = await lstat(via(parent, basename(directory)))
    if (currentRoot.dev !== rootInfo.dev || currentRoot.ino !== rootInfo.ino) {
      throw new Error("Residue target changed before final directory removal.")
    }
    await assertNoMounts(directory)
    await rmdir(via(parent, basename(directory)))
    return []
  } finally {
    await Promise.all([...handles.values(), parent].map(async (handle) => { await handle.close() }))
  }
}

async function worktreeLocked(git, canonical, directory) {
  const records = (await git(canonical, "worktree", "list", "--porcelain")).split("\n\n")
  return records.some((record) => record.split("\n").includes(`worktree ${directory}`) && record.split("\n").some((line) => line === "locked" || line.startsWith("locked ")))
}

export async function setup(ctx) {
  const project = ctx.location.project
  const canonical = project.canonical
  const parent = join(homedir(), "work", "worktrees", basename(canonical))

  await ctx.tool.transform((editor) => {
    editor.add({
      name: "task_worktree",
      description: "Inspect, prepare, or select native task worktrees. Leave moves the session to the canonical checkout for explicitly requested cleanup. Remove deletes exactly one registered task worktree only after the v2 cleanup skill's authorization, runtime, and data-loss checks; it never deletes the branch.",
      input: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["inspect", "prepare", "select", "leave", "remove"] },
          branch: { type: "string", description: "Task branch for prepare; follows repository naming conventions." },
          base: { type: "string", description: "Optional starting ref for a new branch; defaults to canonical HEAD." },
          directory: { type: "string", description: "Absolute registered worktree path for select or explicitly authorized remove, after ownership/status inspection." },
          force: { type: "boolean", description: "Remove only: false by default; true only after cleanup policy explicitly permits discarding the verified target contents." },
        },
        required: ["action"],
        additionalProperties: false,
      },
      async execute(input, context) {
        await ctx.permission.assert({
          sessionID: context.sessionID,
          agent: context.agent,
          source: { type: "tool", messageID: context.messageID, id: context.id },
          action: "task_worktree",
          resources: [input.action],
          save: [input.action],
          metadata: { directory: input.directory, force: input.force ?? false },
        })
        const git = async (directory, ...args) => {
          const result = await runGit(directory, args, context.signal)
          return result.stdout.trim()
        }
        const session = await ctx.session.get({ sessionID: context.sessionID })
        if (session.projectID !== project.id) throw new Error("Session belongs to a different project.")
        const current = session.location.directory
        await ctx.worktree.refresh({ projectID: project.id })
        const inventory = await ctx.worktree.list({ projectID: project.id })
        if (input.action === "inspect") {
          const worktrees = []
          for (const entry of inventory) {
            worktrees.push({
              ...entry,
              branch: await git(entry.directory, "branch", "--show-current"),
              status: await git(entry.directory, "status", "--short"),
            })
          }
          return { content: JSON.stringify({ canonical, current, parent, worktrees }) }
        }
        if (input.action === "leave") {
          await ctx.session.move({ sessionID: context.sessionID, directory: canonical })
          return { content: JSON.stringify({ directory: canonical, moved: true, verifyLocationBeforeCleanup: true }) }
        }
        if (input.action === "select" || input.action === "remove") {
          if (!input.directory || resolve(input.directory) !== input.directory) {
            throw new Error("Select/remove requires an absolute worktree directory.")
          }
          const info = await lstat(input.directory)
          if (info.isSymbolicLink()) {
            throw new Error("A worktree target cannot be a symlink.")
          }
          const directory = await realpath(input.directory)
          const canonicalDirectory = await realpath(canonical)
          if (directory === canonicalDirectory) {
            throw new Error("Select a task worktree, not the canonical checkout.")
          }
          if (!inventory.some((entry) => entry.directory === directory)) {
            throw new Error("Directory is not registered to this project. Inspect and refresh first.")
          }
          if (input.action === "remove") {
            if (directory === resolve(sep) || directory === await realpath(homedir()) || directory === parent) {
              throw new Error("A worktree target cannot be the filesystem root, home directory, or worktree parent.")
            }
            if (!isSameOrDescendant(parent, directory)) {
              throw new Error("Only task worktrees created beneath the adapter worktree parent can be removed.")
            }
            if (inventory.some((entry) => entry.directory !== directory && isSameOrDescendant(directory, entry.directory))) {
              throw new Error("A worktree target cannot be an ancestor of another registered worktree.")
            }
            const currentPath = await realpath(current)
            const fromTarget = relative(directory, currentPath)
            if (fromTarget === "" || (!isAbsolute(fromTarget) && fromTarget !== ".." && !fromTarget.startsWith("../"))) {
              throw new Error("Session is inside the target. Use leave, wait for the next step boundary, and verify the session location before removal.")
            }
            await assertNoMounts(directory)
            await assertNoNestedRepositories(directory, inventory)
            if (await worktreeLocked(git, canonical, directory)) {
              throw new Error("A locked worktree cannot be removed without resolving its exact lock.")
            }
            const status = await git(directory, "status", "--porcelain=v1", "--untracked-files=all", "--ignore-submodules=none")
            if (status && !input.force) {
              throw new Error("Worktree contains tracked, staged, or untracked changes. Explicit discard consent is required before force removal.")
            }
            // Capture authorized entries before native removal: ignored entries
            // normally, or all entries with explicit full-discard authorization.
            // This is the only
            // evidence accepted for the narrowly scoped post-removal residue step.
            const residueSnapshot = await ignoredResidueSnapshot(directory, input.force === true)
            // The cleanup skill performs runtime/ownership/consent checks before this native operation.
            await ctx.worktree.remove({ projectID: project.id, directory, force: input.force ?? false })
            await ctx.worktree.refresh({ projectID: project.id })
            const remaining = await ctx.worktree.list({ projectID: project.id })
            const registrationRemoved = !remaining.some((entry) => entry.directory === directory)
            if (!registrationRemoved) {
              return { content: JSON.stringify({
                directory,
                removed: false,
                registrationRemoved: false,
                folderRemoved: false,
                ignoredResidueRemoved: false,
                branchDeleted: false,
                reason: "Native removal returned but the exact worktree remains registered.",
              }) }
            }
            if (!await exists(directory)) {
              return { content: JSON.stringify({
                directory,
                removed: true,
                registrationRemoved: true,
                folderRemoved: true,
                ignoredResidueRemoved: false,
                branchDeleted: false,
              }) }
            }
            const residueInfo = await lstat(directory)
            if (residueInfo.isSymbolicLink() || !residueInfo.isDirectory()) {
              return { content: JSON.stringify({
                directory,
                removed: false,
                registrationRemoved: true,
                folderRemoved: false,
                ignoredResidueRemoved: false,
                branchDeleted: false,
                reason: "Native removal left an unsafe non-directory or symlink residue.",
              }) }
            }
            try {
              await assertNoMounts(directory)
              await assertNoNestedRepositories(directory, remaining)
              const unexpected = await removeVerifiedResidue(directory, residueSnapshot)
              if (unexpected.length) {
                return { content: JSON.stringify({
                  directory,
                  removed: false,
                  registrationRemoved: true,
                  folderRemoved: false,
                  ignoredResidueRemoved: false,
                  branchDeleted: false,
                  reason: "Native removal left residue outside the authorized pre-removal snapshot.",
                  residue: unexpected,
                }) }
              }
              // This is deliberately not an exposed generic deletion operation:
              // only the exact, formerly registered target's verified ignored
              // leaves were removed, followed by its now-empty directory.
            } catch (error) {
              return { content: JSON.stringify({
                directory,
                removed: false,
                registrationRemoved: true,
                folderRemoved: false,
                ignoredResidueRemoved: false,
                branchDeleted: false,
                reason: `Verified ignored residue could not be removed: ${error.message}`,
              }) }
            }
            const folderRemoved = !await exists(directory)
            return { content: JSON.stringify({
              directory,
              removed: folderRemoved,
              registrationRemoved: true,
              folderRemoved,
              ignoredResidueRemoved: folderRemoved,
              branchDeleted: false,
              ...(folderRemoved ? {} : { reason: "Verified residue removal returned but the target folder remains." }),
            }) }
          }
          await ctx.session.move({ sessionID: context.sessionID, directory })
          return { content: JSON.stringify({ directory, moved: true, verifyLocationBeforeEditing: true }) }
        }
        if (input.action !== "prepare" || !input.branch) {
          throw new Error("Prepare requires a task branch.")
        }
        await git(canonical, "check-ref-format", "--branch", input.branch)
        // Never auto-reuse a checkout: ownership and dirty-state decisions belong to the caller.
        const records = (await git(canonical, "worktree", "list", "--porcelain")).split("\n\n")
        if (records.some((record) => record.split("\n").includes(`branch refs/heads/${input.branch}`))) {
          throw new Error("Branch already has a worktree. Inspect it and use select after confirming task ownership.")
        }
        const name = input.branch.replaceAll("/", "-")
        const expected = join(parent, name)
        if (await exists(expected)) {
          throw new Error(`Destination already exists: ${expected}. Inspect before reuse.`)
        }
        const branches = await git(canonical, "for-each-ref", "--format=%(refname)", `refs/heads/${input.branch}`)
        const existingBranch = branches.split("\n").includes(`refs/heads/${input.branch}`)
        if (existingBranch && input.base) {
          throw new Error("An existing branch cannot be given a new base.")
        }
        const base = existingBranch ? `refs/heads/${input.branch}` : (input.base ?? "HEAD")
        const start = await git(canonical, "rev-parse", "--verify", "--end-of-options", `${base}^{commit}`)
        const created = await ctx.worktree.create({
          projectID: project.id,
          directory: parent,
          name,
          from: canonical,
          branch: start,
        })
        // Native creation is detached. Keep named task branches without replacing its Git strategy.
        try {
          if (existingBranch) await git(created.directory, "switch", input.branch)
          else await git(created.directory, "switch", "-c", input.branch)
        } catch (error) {
          throw new Error(`Native worktree remains registered at ${created.directory}; branch attachment failed. Inspect status and branch ownership there, then run git switch with the intended branch (or git switch -c if it does not exist), and use select. Do not retry prepare against this existing destination. No automatic removal was attempted. ${error.message}`)
        }
        const warnings = []
        const dependencies = []
        for (const dependency of ["node_modules", "vendor"]) {
          const source = join(current, dependency)
          const target = join(created.directory, dependency)
          const info = await exists(source)
          if (!info?.isDirectory() || info.isSymbolicLink()) continue
          if (await exists(target)) {
            warnings.push(`Skipped existing ${dependency} in the new worktree.`)
            continue
          }
          try {
            await cp(source, target, { recursive: true, force: false, errorOnExist: true, verbatimSymlinks: true })
            dependencies.push(dependency)
          } catch (error) {
            warnings.push(`${dependency} copy failed: ${error.message}`)
          }
        }
        try {
          await ctx.session.move({ sessionID: context.sessionID, directory: created.directory })
        } catch (error) {
          throw new Error(`Task worktree is ready at ${created.directory} on ${input.branch}, but session movement failed. Inspect it and use select; no automatic removal was attempted. ${error.message}`)
        }
        return { content: JSON.stringify({
          directory: created.directory,
          branch: input.branch,
          dependencies,
          warnings,
          moved: true,
          verifyLocationBeforeEditing: true,
        }) }
      },
    })
  })
}
