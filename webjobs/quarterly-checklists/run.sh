#!/bin/bash
set -euo pipefail

echo "Starting quarterly checklist generation WebJob..."
npm run generate-checklists
