# GitHub Action to N8N Workflow Integration Guide

This guide explains how to set up and use the GitHub Action that triggers n8n workflows via webhooks.

## Overview

The `trigger-n8n-workflow.yml` GitHub Action automatically triggers n8n workflows when specific GitHub events occur. It sends comprehensive payload data that can be used within your n8n workflows.

## Setup Instructions

### 1. GitHub Repository Setup

#### Add Repository Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions, then add:

**Required:**
- `N8N_WEBHOOK_URL`: Your n8n webhook URL (e.g., `https://your-n8n-instance.com/webhook/github-trigger`)

**Optional:**
- `N8N_API_KEY`: API key for authenticated requests to n8n

### 2. N8N Workflow Setup

#### Create a Webhook Trigger Node

1. **Add Webhook Node**
   - In your n8n workflow, add a "Webhook" trigger node
   - Set the webhook path (e.g., `/github-trigger`)
   - Choose HTTP Method: `POST`
   - Set Response Mode: `Last Node` or `First Entry Text`

2. **Configure Webhook Settings**
   ```
   Webhook URLs: /webhook/github-trigger
   HTTP Method: POST
   Authentication: None (or Bearer Token if using N8N_API_KEY)
   ```

#### Understanding the Payload Structure

The GitHub Action sends a JSON payload with the following structure:

```json
{
  "github": {
    "event_name": "push|pull_request|issues|release|workflow_dispatch",
    "repository": {
      "name": "repository-name",
      "owner": "owner-name",
      "full_name": "owner/repository",
      "html_url": "https://github.com/owner/repository",
      "clone_url": "https://github.com/owner/repository.git"
    },
    "ref": "refs/heads/main",
    "ref_name": "main",
    "sha": "commit-sha",
    "actor": "username",
    "workflow": "Trigger N8N Workflow",
    "run_id": "123456789",
    "run_number": "42"
  },
  "commit": {
    "sha": "commit-sha",
    "message": "commit message",
    "author": {
      "name": "Author Name",
      "email": "author@email.com"
    },
    "url": "https://github.com/owner/repo/commit/sha"
  },
  "pull_request": {
    "number": 123,
    "title": "PR Title",
    "body": "PR Description",
    "state": "open|closed",
    "merged": true|false,
    "user": {
      "login": "username"
    },
    "head": {
      "ref": "feature-branch",
      "sha": "head-sha"
    },
    "base": {
      "ref": "main",
      "sha": "base-sha"
    }
  },
  "issue": {
    "number": 456,
    "title": "Issue Title",
    "body": "Issue Description",
    "state": "open|closed",
    "user": {
      "login": "username"
    },
    "labels": [...]
  },
  "release": {
    "tag_name": "v1.0.0",
    "name": "Release Name",
    "body": "Release Notes",
    "draft": false,
    "prerelease": false
  },
  "inputs": {
    "environment": "staging|production",
    "message": "custom message"
  },
  "timestamp": "2025-07-15T10:30:00Z",
  "custom_data": {
    "project_name": "PR-review-aid",
    "department": "engineering",
    "priority": "normal"
  }
}
```

### 3. N8N Workflow Examples

#### Example 1: Simple Event Processor
```
1. Webhook Trigger
2. Switch Node (based on github.event_name)
   - Case "push": → Send notification
   - Case "pull_request": → Code review workflow
   - Case "issues": → Issue management workflow
3. Action nodes based on event type
```

#### Example 2: Conditional Processing
```
1. Webhook Trigger
2. IF Node: Check if github.ref_name === "main"
   - True: → Production deployment workflow
   - False: → Development testing workflow
```

#### Example 3: Multi-step Workflow
```
1. Webhook Trigger
2. Set Node: Extract key variables
3. HTTP Request: Fetch additional data
4. Switch Node: Route based on event type
5. Multiple action branches
6. Merge Node: Combine results
7. Send notification/response
```

## Accessing Data in N8N

### Using Expressions in N8N Nodes

Access payload data using these expressions:

```javascript
// GitHub event type
{{ $json.github.event_name }}

// Repository information
{{ $json.github.repository.name }}
{{ $json.github.repository.owner }}

// Commit information
{{ $json.commit.message }}
{{ $json.commit.author.name }}

// Pull Request data (when applicable)
{{ $json.pull_request.number }}
{{ $json.pull_request.title }}
{{ $json.pull_request.state }}

// Issue data (when applicable)
{{ $json.issue.number }}
{{ $json.issue.title }}

// Manual trigger inputs
{{ $json.inputs.environment }}
{{ $json.inputs.message }}

// Custom data
{{ $json.custom_data.project_name }}
```

### Setting Variables in N8N

Use a "Set" node to extract and clean data:

```javascript
// In a Set node
{
  "eventType": "{{ $json.github.event_name }}",
  "repository": "{{ $json.github.repository.name }}",
  "branch": "{{ $json.github.ref_name }}",
  "author": "{{ $json.commit.author.name }}",
  "isPullRequest": "{{ $json.github.event_name === 'pull_request' }}",
  "isMainBranch": "{{ $json.github.ref_name === 'main' }}"
}
```

## Advanced Configuration

### Webhook Authentication

If using the `N8N_API_KEY` secret, configure your n8n webhook for authentication:

1. In the Webhook node, set Authentication to "Header Auth"
2. Set Header Name: `Authorization`
3. Set Header Value: `Bearer {{ $credentials.api_key }}`

### Custom Triggers

Modify the GitHub Action trigger conditions in the workflow file:

```yaml
on:
  push:
    branches: [ main, develop, 'feature/*' ]
    paths: 
      - 'src/**'
      - '!docs/**'
  pull_request:
    types: [opened, synchronize, ready_for_review]
  schedule:
    - cron: '0 9 * * MON'  # Every Monday at 9 AM
```

### Environment-specific Workflows

Use different webhook URLs for different environments:

```yaml
env:
  N8N_WEBHOOK_URL: ${{ github.ref == 'refs/heads/main' && secrets.N8N_PROD_WEBHOOK_URL || secrets.N8N_DEV_WEBHOOK_URL }}
```

## Troubleshooting

### Common Issues

1. **404 Error**: Check webhook URL and n8n instance accessibility
2. **401/403 Error**: Verify API key configuration
3. **Timeout**: Check n8n instance performance and network connectivity
4. **Payload Issues**: Use the workflow logs to inspect the generated payload

### Debugging

1. **GitHub Actions Logs**: Check the workflow run logs for detailed information
2. **N8N Execution Logs**: Monitor n8n execution history
3. **Test Webhook**: Use manual workflow dispatch to test integration

### Testing

Trigger the workflow manually for testing:

1. Go to GitHub repository → Actions → "Trigger N8N Workflow"
2. Click "Run workflow"
3. Choose environment and add test message
4. Click "Run workflow"

## Security Considerations

1. **Secrets Management**: Never hardcode sensitive information
2. **Webhook Security**: Consider using webhook signatures for verification
3. **Network Security**: Ensure n8n instance is properly secured
4. **Access Control**: Limit GitHub Action permissions as needed

## Customization

### Adding Custom Data

Modify the payload generation section in the GitHub Action:

```yaml
- name: Prepare payload data
  id: payload
  run: |
    # Add your custom data to the payload
    cat << EOF > payload.json
    {
      # ... existing payload structure ...
      "custom_data": {
        "project_name": "PR-review-aid",
        "department": "engineering",
        "priority": "normal",
        "your_custom_field": "your_custom_value"
      }
    }
    EOF
```

### Multiple N8N Workflows

To trigger different n8n workflows based on events:

```yaml
env:
  N8N_WEBHOOK_URL_PUSH: ${{ secrets.N8N_WEBHOOK_URL_PUSH }}
  N8N_WEBHOOK_URL_PR: ${{ secrets.N8N_WEBHOOK_URL_PR }}
  N8N_WEBHOOK_URL_ISSUE: ${{ secrets.N8N_WEBHOOK_URL_ISSUE }}
```

Then use conditional steps to trigger the appropriate webhook.

---

This integration provides a robust foundation for automating workflows between GitHub and n8n, enabling sophisticated automation based on repository events.
