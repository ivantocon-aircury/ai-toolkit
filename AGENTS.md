# Agent Instructions

Any prompt about creating, updating, or deleting skills, OpenCode configuration, or any other agents configuration file refers to the current repository unless the user explicitly says otherwise.

Any new skill should be added to the `.agents` folder inside the repository, following the existing skills naming format.

Keep `.opencode-auto` and `.opencode-normal` behavior aligned except for documented
permission, security, and privacy differences. When changing shared instructions
or agents, update both profiles and verify that their shared files remain equal.

Global skills define adaptable defaults. They must defer to explicit user requests,
project instructions, installed versions, and demonstrated project conventions.

For branches, commits, and pull-request titles, preserve an explicitly supplied
work reference in the repository's established format. When this repository has
no more specific convention, use `[REF-123] Description` for commit and
pull-request titles and `feature/REF-123_description` for branches. Never invent
a reference or require one: when none is supplied, create the artifact without
one. A worktree created for its branch needs no separate reference.
