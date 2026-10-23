import { execFile } from "node:child_process"
import { cp, lstat, realpath } from "node:fs/promises"
import { homedir } from "node:os"
import { basename, join, resolve } from "node:path"
import { promisify } from "node:util"

const exec = promisify(execFile)

async function exists(path) {
  try {
    return await lstat(path)
  } catch (error) {
    if (error.code === "ENOENT") return undefined
    throw error
  }
}

export async function setup(ctx) {
  const project = ctx.location.project
  const canonical = project.canonical
  const parent = join(homedir(), "work", "worktrees", basename(canonical))

  await ctx.tool.transform((editor) => {
    editor.add({
      name: "task_worktree",
      description: "Inspect native task worktrees, prepare a named branch/worktree, or select an inspected existing worktree and move this session there. Never removes worktrees.",
      input: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["inspect", "prepare", "select"] },
          branch: { type: "string", description: "Task branch for prepare; follows repository naming conventions." },
          base: { type: "string", description: "Optional starting ref for a new branch; defaults to canonical HEAD." },
          directory: { type: "string", description: "Absolute registered worktree path for select, after ownership/status inspection." },
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
          resources: ["*"],
          save: ["*"],
        })
        const git = async (directory, ...args) => {
          const result = await exec("git", args, { cwd: directory, signal: context.signal })
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
        if (input.action === "select") {
          if (!input.directory || resolve(input.directory) !== input.directory) {
            throw new Error("Select requires an absolute worktree directory.")
          }
          const directory = await realpath(input.directory)
          if (directory === await realpath(canonical)) {
            throw new Error("Select a task worktree, not the canonical checkout.")
          }
          if (!inventory.some((entry) => entry.directory === directory)) {
            throw new Error("Directory is not registered to this project. Inspect and refresh first.")
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
