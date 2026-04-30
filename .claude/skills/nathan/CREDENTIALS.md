# Nathan — Setup & Credentials Guide

Nathan is an AI-powered PR review tool. When triggered, it collects pull request data and sends it to an n8n workflow, which returns inline code suggestions posted directly to the PR.

---

## How it works

```
Developer posts +Nathan as a PR comment
               ↓
  Nathan Gate (nathan-gate.yml)
  - Verifies caller has write+ permission
  - Enforces 2-minute cooldown between triggers
               ↓
  Nathan workflow (trigger-n8n-workflow.yml)
  - Gathers PR diff, files, and commits
  - Sends signed payload to n8n webhook
               ↓
       n8n processes the review
               ↓
  Workflow receives signed response
  and posts inline suggestions to the PR
```

---

## Setting up Nathan in a repository

### Step 1 — Add the workflow files to `main`

Copy both files into `.github/workflows/` on the repository's **`main` branch**:

| File | Purpose |
|------|---------|
| `nathan-gate.yml` | Listens for `+Nathan` PR comments; checks permissions and cooldown; dispatches the main workflow |
| `trigger-n8n-workflow.yml` | Gathers PR data; sends it to n8n; receives the response and posts review comments |

> GitHub only reads workflow files from the default branch. The workflows will not run if the files only exist on a feature branch.

### Step 2 — Create two GitHub environments

Go to **Settings → Environments** in the repository and create:

**`n8n-sending`** — add these secrets:

| Secret Name | Description | Value from |
|-------------|-------------|------------|
| `N8N_WEBHOOK_URL` | Full HTTPS URL of the n8n webhook | LastPass |
| `N8N_SENDING_TOKEN` | Shared secret for signing outbound payloads (HMAC-SHA256) | LastPass |
| `N8N_ALLOWED_HOST` | Hostname only from `N8N_WEBHOOK_URL` (e.g. `n8n.example.com`) | LastPass |

**`n8n-receiving`** — add this secret:

| Secret Name | Description | Value from |
|-------------|-------------|------------|
| `N8N_RECEIVING_TOKEN` | Shared secret for verifying signatures on n8n's response | LastPass |

### Step 3 — Add the optional failure webhook (recommended)

Go to **Settings → Secrets and variables → Actions → Secrets** and add:

| Secret Name | Description | Value from |
|-------------|-------------|------------|
| `ERROR_WEBHOOK_URL` | HTTPS URL to notify when the workflow fails (Slack, Discord, etc.) | LastPass |

---

## How to add a secret in GitHub

1. Go to the repository on GitHub
2. Click **Settings** → **Environments** (for environment secrets) or **Secrets and variables → Actions** (for repo-level secrets)
3. Select the correct environment (`n8n-sending` or `n8n-receiving`) or click **New repository secret**
4. Enter the exact secret name from the tables above
5. Paste the value from LastPass
6. Click **Add secret**

---

## Triggering a review

There are two ways to trigger Nathan once it is set up:

**1. PR comment (manual)**
Post a comment containing `+Nathan` (case-insensitive) on any open PR. The review will start within seconds.

**2. Slash command via Claude Code**
Run `/nathan` in your terminal while on the branch with an open PR. Claude will find the PR and post the comment automatically.

> Only users with **write access or above** on the repository can trigger Nathan. Comments from users with lower permissions are silently ignored.

---

## Access control

| Permission | Can trigger | Cooldown |
|------------|-------------|----------|
| admin | Yes | 2 minutes |
| maintain | Yes | 2 minutes |
| write | Yes | 2 minutes |
| triage / read | No | — |

The 2-minute cooldown prevents duplicate reviews from rapid re-triggers. It applies to all authorized users.

---

## Troubleshooting

**Review does not start after posting `+Nathan`**
- Confirm your account has write access or higher on the repository
- Check the **Actions** tab for the "Nathan Gate" workflow run — it logs the reason it was skipped

**Workflow runs but no comment is posted**
- Check the "Nathan" workflow run in the **Actions** tab for errors
- Verify all secrets are set correctly in both environments
- Confirm n8n is reachable and returning a correctly signed response

**Signature verification failure**
- Ensure `N8N_RECEIVING_TOKEN` in the `n8n-receiving` environment matches the token n8n uses to sign its responses
