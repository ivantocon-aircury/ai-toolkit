# Agent Instructions

Any prompt about creating, updating, or deleting skills, OpenCode configuration, or any other agents configuration file refers to the current repository unless the user explicitly says otherwise.

Any new skill should be added to the `.agents` folder inside the repository, following the existing skills naming format.

Keep `.opencode-auto` and `.opencode-normal` behavior aligned except for documented
permission, security, and privacy differences. When changing shared instructions
or agents, update both profiles and verify that their shared files remain equal.

Global skills define adaptable defaults. They must defer to explicit user requests,
project instructions, installed versions, and demonstrated project conventions.
