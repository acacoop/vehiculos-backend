#!/bin/bash
set -euo pipefail

cd "/home/site/wwwroot"

echo "Starting quarterly control generation WebJob..."

node dist/scripts/generateQuarterlyControls.js
