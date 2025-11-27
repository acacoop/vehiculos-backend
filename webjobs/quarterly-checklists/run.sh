#!/bin/bash
set -euo pipefail

cd "/home/site/wwwroot"

echo "Starting quarterly checklist generation WebJob..."

node dist/scripts/generateQuarterlyChecklists.js
