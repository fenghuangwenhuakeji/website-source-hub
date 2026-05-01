const fs = require('fs');
const path = require('path');

class SentientAgentCore {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.memoryDir = path.join(baseDir, 'memory');
    this.stateDir = path.join(baseDir, 'state');
    this.manifestPath = path.join(baseDir, 'agent.manifest.json');
    this.personalityPath = path.join(baseDir, 'personality.json');
    this.lifecyclePath = path.join(this.stateDir, 'lifecycle.json');
    this.learningLogPath = path.join(this.memoryDir, 'learning-log.md');
    this.dreamsPath = path.join(this.memoryDir, 'dreams.md');
  }

  ensureDirs() {
    for (const dir of [this.memoryDir, this.stateDir]) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
  }

  readJson(filePath, fallback = {}) {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  writeJson(filePath, value) {
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
  }

  appendLine(filePath, line) {
    fs.appendFileSync(filePath, line + '\n');
  }

  setPhase(phase) {
    this.ensureDirs();
    const lifecycle = this.readJson(this.lifecyclePath, {
      phase: 'standby',
      phases: ['boot', 'understand', 'interact', 'execute', 'inspect', 'improve', 'update', 'standby'],
      backgroundLoops: ['learn', 'dream', 'compress'],
    });
    lifecycle.phase = phase;
    lifecycle.updatedAt = new Date().toISOString();
    this.writeJson(this.lifecyclePath, lifecycle);
  }

  learn(note) {
    this.ensureDirs();
    this.appendLine(this.learningLogPath, '- ' + note);
  }

  dream(note = 'idle synthesis pending') {
    this.ensureDirs();
    this.appendLine(this.dreamsPath, '- ' + note);
  }

  bootstrap() {
    this.ensureDirs();
    return {
      manifest: this.readJson(this.manifestPath),
      personality: this.readJson(this.personalityPath),
      lifecycle: this.readJson(this.lifecyclePath, {}),
      memoryDir: this.memoryDir,
      stateDir: this.stateDir,
    };
  }
}

module.exports = { SentientAgentCore };