const fs = require('fs');
const path = require('path');

function findRuntime(startDir) {
  let current = startDir;
  while (current && current !== path.dirname(current)) {
    const candidate = path.join(current, '_agent-system', 'runtime', 'agent-runtime.js');
    if (fs.existsSync(candidate)) return candidate;
    current = path.dirname(current);
  }
  throw new Error('Shared agent runtime not found.');
}

const { AgentRuntime } = require(findRuntime(__dirname));

function boot(input = {}) {
  const runtime = new AgentRuntime(__dirname);
  return runtime.boot(input);
}

module.exports = { boot, AgentRuntime };