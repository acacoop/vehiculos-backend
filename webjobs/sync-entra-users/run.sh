#!/bin/bash
set -euo pipefail

cd "/home/site/wwwroot"

echo "Starting Entra ID user sync WebJob..."

node dist/scripts/syncEntraUsers.js
