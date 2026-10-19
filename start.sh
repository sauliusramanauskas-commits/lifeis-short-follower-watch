#!/bin/bash
set -e
mkdir -p screenshots
test -f state.json || echo '{}' > state.json
test -f history.jsonl || touch history.jsonl
exec node web/server.js
