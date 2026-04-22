const { SentientAgentCore } = require('./sentient-agent-core');

function run() {
  const core = new SentientAgentCore(__dirname);
  core.setPhase('boot');
  const result = core.bootstrap();
  core.setPhase('standby');
  return result;
}

if (require.main === module) {
  console.log(JSON.stringify(run(), null, 2));
}

module.exports = { run };