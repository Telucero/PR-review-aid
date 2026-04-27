---
name: Nathan
description: Triggers the Nathan AI review workflow by posting "+Nathan" on the open GitHub PR for the current branch. Use when you want to request an automated style guide review. No arguments required. Requires an open PR on the current branch and the GitHub CLI (gh) to be authenticated with maintainer or admin permission.
chain-role: isolated
invocation: user
allowed-tools: Bash(git:*) Bash(gh:*)
---

# Nathan

Trigger the Nathan AI review by posting `+Nathan` on the open GitHub PR for the current branch.

## Instructions

### Step 1: Resolve current branch
Run `git branch --show-current`.

If output is empty (detached HEAD), stop: "Cannot determine the current branch — the repository is in detached HEAD state. Check out a branch first."

### Step 2: Find open PR
```
gh pr list --head "<branch-name>" --state open --json number,title,url --limit 1
```

- If result is `[]`, stop: "No open PR found for branch '<branch-name>'. Please open a PR on GitHub before triggering a review."
- If command fails, report the error and stop.

Parse `number`, `title`, and `url` from the result.

### Step 3: Post +Nathan comment
```bash
gh pr comment <number> --body '+Nathan'
```

### Step 4: Confirm
```
✅ Nathan review triggered on PR #<number> (<title>)
<url>
The Nathan Gate workflow will begin shortly.
```

## Examples

### Example 1: Trigger review on current branch
User says: `/Nathan`
Actions:
1. Gets branch → `feature/add-docs`
2. Finds open PR → #23 "Add documentation"
3. Posts `+Nathan`
Result: "✅ Nathan review triggered on PR #23 (Add documentation)\nhttps://github.com/..."

### Example 2: No open PR (edge case)
User says: `/Nathan`
Actions:
1. Gets branch → `old-branch`
2. No open PR found
Result: "No open PR found for branch 'old-branch'. Please open a PR on GitHub before triggering a review."

## Troubleshooting

### Error: `gh: command not found`
Cause: GitHub CLI not installed or not in PATH.
Solution: Install from https://cli.github.com and run `gh auth login`.

### Error: HTTP 401 / auth failure
Cause: GitHub CLI is not authenticated.
Solution: Run `gh auth login` and follow the prompts.

### Error: No open PR found
Cause: PR does not exist for this branch, or is closed/merged.
Solution: Open a PR on GitHub first, or switch to a branch with an active PR.

### Error: Nathan review does not start
Cause: Your account does not have `maintain` or `admin` permission on this repository.
Solution: Verify your permissions — the Nathan Gate workflow enforces a maintainer-only check before dispatching.
