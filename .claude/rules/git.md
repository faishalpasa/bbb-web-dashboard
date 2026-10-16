# Git

## Commit and push policy

- Never commit or push automatically after making changes.
- Only commit when the user explicitly asks. Only push when the user explicitly asks.
- After completing a task, stop at verified working-tree changes; do not run `git add`, commit, push, open a PR, or deploy unless requested.
- Never amend, rebase, force-push, or discard user changes without explicit approval.
- Never include Claude, Codex, Anthropic, OpenAI, or other AI attribution in commits or PRs.

## Working practice

- Default branch is `main`. Day-to-day development happens on `development`; do not commit directly to `main`.
- Inspect `git status --short` before editing and preserve unrelated work.
- Make small coherent commits when requested: scaffold, one screen, one service, one fix.
- Commit style: `type(scope): imperative summary`, for example `feat(auth): add forgot-password screens`.
- Never commit `.env`, credentials, or local build state (`dist`, `node_modules`).
- Run proportional checks before proposing a commit and report any unverified boundary.

## Pull requests

- If a PR is requested, its title matches the source branch name unless the user specifies otherwise.
- Do not merge or deploy merely because a PR was created.
