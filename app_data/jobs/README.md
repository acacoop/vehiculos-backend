# WebJobs

This directory contains the WebJobs that run on Azure App Service.

## Structure

The structure follows the Azure App Service convention for WebJobs:

```bash
app_data/
└── jobs/
    ├── continuous/   # For continuous jobs (always running)
    └── triggered/    # For scheduled or manually triggered jobs
```

## Available WebJobs

### 1. quarterly-controls (Triggered)

Generates quarterly controls for all active vehicles.

- **Frequency**: Quarterly (1st of Jan, Apr, Jul, Oct at 00:00 UTC)
- **Cron**: `0 0 0 1 1,4,7,10 *`
- **Script**: `node dist/scripts/generateQuarterlyControls.js`
- **Location**: `app_data/jobs/triggered/quarterly-controls`

### 2. sync-entra-users (Triggered)

Synchronizes users from Microsoft Entra ID (Azure AD) with the local database.

- **Frequency**: Daily (02:00 UTC)
- **Cron**: `0 0 2 * * *`
- **Script**: `node dist/scripts/syncEntraUsers.js`
- **Location**: `app_data/jobs/triggered/sync-entra-users`

## Deployment

WebJobs are deployed automatically with the application code.
The `app_data` folder is included in the deployment artifact.

**Important**: The `run.sh` scripts must have executable permissions. The CI/CD pipeline handles this automatically:

```yaml
- name: Make WebJob scripts executable
  run: |
    chmod -R +x app_data/jobs/continuous/*/run.sh || true
    chmod -R +x app_data/jobs/triggered/*/run.sh || true
```
