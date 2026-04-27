Post a comment on the open GitHub PR for the current git branch.

## Message to post
$ARGUMENTS

---

If the "Message to post" section above is empty, ask the user: "What message would you like to post on the PR?" and wait for their input before continuing.

## Steps

1. Run `git branch --show-current` to get the current branch name.
   - If the output is empty (detached HEAD state), stop and say: "Cannot determine the current branch — the repository is in detached HEAD state. Check out a branch first."

2. Find the open PR for this branch by running:
   ```
   gh pr list --head "<branch-name>" --state open --json number,title,url --limit 1
   ```
   - If the result is `[]` (empty array), stop and say: "No open PR found for branch '<branch-name>'. Please open a PR on GitHub before posting a comment."
   - If the command fails with an error, report the error and stop.

3. Parse the PR `number`, `title`, and `url` from the JSON result.

4. Post the comment. Construct the `gh pr comment` call so the message body is passed safely — use `--body-file` with a temp file (via `mktemp`) to avoid any shell-quoting issues with special characters, newlines, or backticks in the message:
   ```
   tmp=$(mktemp)
   printf '%s' '<message>' > "$tmp"
   gh pr comment <number> --body-file "$tmp"
   rm -f "$tmp"
   ```

5. Confirm to the user:
   "✅ Comment posted on PR #<number> (<title>)
   <url>"
