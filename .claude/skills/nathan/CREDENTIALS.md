# Nathan — Credentials & Secrets Setup

All secret values are stored in **LastPass**. This document lists the exact names to use when configuring GitHub and where each one goes.

---

## GitHub Environments

You need two environments configured under **Settings → Environments** in the repository.

---

### Environment: `n8n-sending`

Secrets added to this environment:

| GitHub Secret Name | Description | Source |
|--------------------|-------------|--------|
| `N8N_WEBHOOK_URL` | Full HTTPS URL of the n8n webhook that receives PR data | LastPass |
| `N8N_SENDING_TOKEN` | Shared secret used to sign outbound payloads (HMAC-SHA256) | LastPass |
| `N8N_ALLOWED_HOST` | Hostname only from `N8N_WEBHOOK_URL` — used to prevent SSRF (e.g. `n8n.example.com`) | LastPass |

---

### Environment: `n8n-receiving`

Secrets added to this environment:

| GitHub Secret Name | Description | Source |
|--------------------|-------------|--------|
| `N8N_RECEIVING_TOKEN` | Shared secret used to verify the signature on n8n's response | LastPass |

---

## Repository-Level Secret (optional)

Added under **Settings → Secrets and variables → Actions → Secrets**:

| GitHub Secret Name | Description | Source |
|--------------------|-------------|--------|
| `ERROR_WEBHOOK_URL` | HTTPS URL to notify when the workflow fails (e.g. Slack or Discord webhook) | LastPass |

---

## Workflow files

The two workflow files must exist on the repository's **`main` branch** for GitHub Actions to run them:

```
.github/workflows/nathan-gate.yml
.github/workflows/trigger-n8n-workflow.yml
```

GitHub only reads workflow files from the default branch. If they are only on a feature branch, the workflows will not trigger.

---

## How to add a secret in GitHub

1. Go to the repository on GitHub
2. Click **Settings** → **Environments** (for environment secrets) or **Secrets and variables → Actions** (for repo-level secrets)
3. Select the correct environment (`n8n-sending` or `n8n-receiving`) or click **New repository secret**
4. Enter the exact secret name from the table above
5. Paste the value from LastPass
6. Click **Add secret**

