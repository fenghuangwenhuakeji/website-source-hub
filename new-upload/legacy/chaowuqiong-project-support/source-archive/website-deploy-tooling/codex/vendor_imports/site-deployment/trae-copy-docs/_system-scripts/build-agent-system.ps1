param(
  [string]$SkillsRoot,
  [string]$MirrorRoot,
  [switch]$SkipManifests
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$DotTraeRoot = Split-Path -Path $PSScriptRoot -Parent
$WorkspaceRoot = Split-Path -Path $DotTraeRoot -Parent
if (-not $PSBoundParameters.ContainsKey('SkillsRoot')) {
  $SkillsRoot = Join-Path $DotTraeRoot 'skills'
}
if (-not $PSBoundParameters.ContainsKey('MirrorRoot')) {
  $existingMirror = Get-ChildItem -Path $WorkspaceRoot -Directory -Force |
    Where-Object { $_.Name -like 'trae*' -and $_.Name -ne '.trae' } |
    Sort-Object @{ Expression = { $_.Name.Length } }, @{ Expression = { $_.FullName } } |
    Select-Object -First 1
  if ($existingMirror) {
    $MirrorRoot = $existingMirror.FullName
  } else {
    $MirrorRoot = Join-Path $WorkspaceRoot 'trae-mirror'
  }
}

function Ensure-Dir([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
  }
}

function Write-Text([string]$Path, [string]$Text) {
  $parent = Split-Path -Path $Path -Parent
  if ($parent) { Ensure-Dir $parent }
  [System.IO.File]::WriteAllText($Path, $Text.TrimStart("`r", "`n"), $Utf8NoBom)
}

function Write-Json([string]$Path, [object]$Data) {
  Write-Text $Path (($Data | ConvertTo-Json -Depth 12))
}

function Rel([string]$Base, [string]$Path) {
  $baseUri = [System.Uri]::new(($Base.TrimEnd('\') + '\'))
  $pathUri = [System.Uri]::new($Path)
  [System.Uri]::UnescapeDataString($baseUri.MakeRelativeUri($pathUri).ToString()).Replace('/', '\')
}

function Norm([string]$Value) {
  $normalized = ($Value -replace '[\\/]+', '__' -replace '\s+', '-' -replace '[^0-9A-Za-z\-_]+', '-').Trim('-')
  if ([string]::IsNullOrWhiteSpace($normalized)) { 'agent' } else { $normalized.ToLowerInvariant() }
}

function Display([string]$Name) {
  $raw = $Name -replace '[-_]+', ' '
  (($raw -split '\s+' | Where-Object { $_ }) | ForEach-Object {
    if ($_.Length -eq 1) { $_.ToUpperInvariant() } else { $_.Substring(0, 1).ToUpperInvariant() + $_.Substring(1) }
  }) -join ' '
}

function Resolve-Profile([string]$SkillName, [string]$Category, [string]$RelativeDir) {
  $probe = "$SkillName $Category $RelativeDir".ToLowerInvariant()
  $result = [ordered]@{
    role = 'specialist'
    persona = 'general-specialist'
    emotion = 'steady-focused'
    memory = 'specialist-worklog'
    context = 'specialist-workbench'
    orchestration = 'solo-specialist'
    tags = @('specialist', 'skill')
  }

  switch -Regex ($probe) {
    'orchestrator|meta-agent|autopilot|agent-team|coordination|collab' {
      $result.role = 'orchestrator'
      $result.persona = 'system-orchestrator'
      $result.emotion = 'calm-strategic'
      $result.memory = 'coordination-ledger'
      $result.context = 'cross-domain-control'
      $result.orchestration = 'hierarchical-coordinator'
      $result.tags = @('orchestrator', 'multi-agent', 'coordination')
      break
    }
    'agent-generator|batch-agent-creator|spec-agent|plan-agent' {
      $result.role = 'agent-designer'
      $result.persona = 'builder-mentor'
      $result.emotion = 'curious-constructive'
      $result.memory = 'blueprint-ledger'
      $result.context = 'agent-factory'
      $result.orchestration = 'mentor-reviewer'
      $result.tags = @('design', 'systemization', 'templates')
      break
    }
    'debug-agent|upgrade-maintenance|test-agent' {
      $result.role = 'debugger'
      $result.persona = 'precision-debugger'
      $result.emotion = 'focused-analytical'
      $result.memory = 'incident-ledger'
      $result.context = 'investigation-lab'
      $result.orchestration = 'mentor-reviewer'
      $result.tags = @('debug', 'quality', 'verification')
      break
    }
    'auth|login|signin|signup|session|token|oauth|permission' {
      $result.role = 'auth-specialist'
      $result.persona = 'trust-guardian'
      $result.emotion = 'protective-reliable'
      $result.memory = 'security-ledger'
      $result.context = 'identity-access-control'
      $result.orchestration = 'specialist-squad-member'
      $result.tags = @('auth', 'security', 'identity')
      break
    }
    'recharge|payment|billing|checkout|wallet|vip|points|order|referral' {
      $result.role = 'business-specialist'
      $result.persona = 'revenue-operator'
      $result.emotion = 'steady-focused'
      $result.memory = 'business-operations-log'
      $result.context = 'commercial-systems'
      $result.orchestration = 'specialist-squad-member'
      $result.tags = @('billing', 'orders', 'growth')
      break
    }
    'frontend|react|vue|mobile|electron|typescript|javascript|html|css|ui' {
      $result.role = 'frontend-specialist'
      $result.persona = 'frontend-experience'
      $result.emotion = 'empathetic-precise'
      $result.memory = 'experience-notebook'
      $result.context = 'frontend-product-lab'
      $result.orchestration = 'specialist-squad-member'
      $result.tags = @('frontend', 'ux', 'product')
      break
    }
    'backend|api|server|service|python-agent|go-agent|java-agent|php-agent|rust-agent|cpp-agent|c-agent|csharp-agent|kotlin-agent' {
      $result.role = 'engineering-specialist'
      $result.persona = 'backend-architect'
      $result.emotion = 'steady-focused'
      $result.memory = 'engineering-journal'
      $result.context = 'backend-service-lab'
      $result.orchestration = 'specialist-squad-member'
      $result.tags = @('engineering', 'service', 'implementation')
      break
    }
    'database|mysql|sql|queue|redis' {
      $result.role = 'data-specialist'
      $result.persona = 'database-curator'
      $result.emotion = 'protective-reliable'
      $result.memory = 'data-governance-log'
      $result.context = 'database-systems'
      $result.orchestration = 'specialist-squad-member'
      $result.tags = @('database', 'integrity', 'migration')
      break
    }
    'deploy|cloud|nginx|pm2|ops|docker|monitoring|aliyun|turbo' {
      $result.role = 'ops-specialist'
      $result.persona = 'ops-guardian'
      $result.emotion = 'protective-reliable'
      $result.memory = 'ops-runbook'
      $result.context = 'ops-control-room'
      $result.orchestration = 'specialist-squad-member'
      $result.tags = @('ops', 'deployment', 'stability')
      break
    }
    'document|markdown|word|excel|ppt|pdf|flowchart|mindmap|json-config|yaml-config|csv' {
      $result.role = 'document-specialist'
      $result.persona = 'document-craftsman'
      $result.emotion = 'calm-strategic'
      $result.memory = 'document-stylebook'
      $result.context = 'document-workbench'
      $result.orchestration = 'solo-specialist'
      $result.tags = @('documentation', 'knowledge', 'formatting')
      break
    }
    'novel|story|narrative|outline|plot|dialogue|screenplay|comic|animation|storyboard|short-film|web-series|tv-series|stage-play|radio-drama|genre|subtext|character|world' {
      $result.role = 'creative-specialist'
      $result.persona = 'story-companion'
      $result.emotion = 'empathetic-creative'
      $result.memory = 'creative-lorebook'
      $result.context = 'creative-studio'
      $result.orchestration = 'specialist-squad-member'
      $result.tags = @('creative', 'storytelling', 'assistant')
      break
    }
    'finance|trading|risk|backtesting|strategy|quant|analysis' {
      $result.role = 'quant-specialist'
      $result.persona = 'quant-strategist'
      $result.emotion = 'focused-analytical'
      $result.memory = 'research-ledger'
      $result.context = 'research-desk'
      $result.orchestration = 'solo-specialist'
      $result.tags = @('quant', 'analysis', 'risk-aware')
      break
    }
  }

  [pscustomobject]$result
}

function Get-ActivationKeywords([string]$SkillName, [string]$Category, [string[]]$Tags) {
  $words = @()
  $words += ($SkillName -split '[-_ ]+' | Where-Object { $_ })
  if ($Category -and $Category -ne 'top-level') {
    $words += ($Category -split '[-_ ]+' | Where-Object { $_ })
  }
  $words += $Tags
  $words += "$SkillName agent"
  $words += "$SkillName skill"
  @($words | ForEach-Object { $_.ToLowerInvariant() } | Where-Object { $_ } | Select-Object -Unique | Select-Object -First 16)
}

function Get-ActivationIntents([string]$Role) {
  switch ($Role) {
    'orchestrator' { return @('coordinate work', 'route to specialists', 'manage handoffs', 'stabilize project flow') }
    'agent-designer' { return @('create agent', 'design skill', 'build templates', 'systemize workflows') }
    'debugger' { return @('investigate bug', 'trace regression', 'verify fix', 'explain root cause') }
    'auth-specialist' { return @('fix login flow', 'repair auth guard', 'stabilize session handling', 'protect identity and access') }
    'business-specialist' { return @('fix recharge flow', 'stabilize payment path', 'verify order lifecycle', 'improve billing experience') }
    'frontend-specialist' { return @('improve UI', 'fix mobile layout', 'refine interaction', 'organize visual hierarchy') }
    'engineering-specialist' { return @('implement feature', 'refactor module', 'stabilize backend', 'improve architecture') }
    'data-specialist' { return @('model data', 'migrate database', 'protect integrity', 'optimize schema') }
    'ops-specialist' { return @('deploy safely', 'configure server', 'restore service', 'prepare rollback') }
    'document-specialist' { return @('write docs', 'structure SOP', 'summarize process', 'format knowledge') }
    'creative-specialist' { return @('write creatively', 'shape story', 'improve pacing', 'protect character voice') }
    'quant-specialist' { return @('analyze data', 'test strategy', 'evaluate risk', 'compare evidence') }
    default { return @('handle specialist task', 'analyze request', 'produce structured output') }
  }
}

function Write-IfMissingText([string]$Path, [string]$Text) {
  if (-not (Test-Path -LiteralPath $Path)) {
    Write-Text $Path $Text
  }
}

function Write-IfMissingJson([string]$Path, [object]$Data) {
  if (-not (Test-Path -LiteralPath $Path)) {
    Write-Json $Path $Data
  }
}

function Ensure-AgentBaseline([pscustomobject]$Record, [hashtable]$Manifest) {
  $memoryDir = Join-Path $Record.skillDir 'memory'
  $stateDir = Join-Path $Record.skillDir 'state'
  $petsDir = Join-Path $Record.skillDir 'pets'
  $contextDir = Join-Path $Record.skillDir 'context'
  $skillsDir = Join-Path $Record.skillDir 'skills'
  $memoryArchiveDir = Join-Path $memoryDir 'archive'
  Ensure-Dir $memoryDir
  Ensure-Dir $stateDir
  Ensure-Dir $petsDir
  Ensure-Dir $contextDir
  Ensure-Dir $skillsDir
  Ensure-Dir $memoryArchiveDir

  Write-IfMissingText (Join-Path $memoryDir 'README.md') @"
# Memory

- namespace: $($Manifest.memorySystem.namespace)
- pack: $($Manifest.memorySystem.pack)
- sharing: $($Manifest.memorySystem.sharing)
- isolation: $($Manifest.memorySystem.isolation)
- long-term store: long-term.json
- working store: working-memory.json
- session summary: session-summary.json
- archive dir: archive/
"@
  Write-IfMissingJson (Join-Path $memoryDir 'long-term.json') @{
    version = 2
    namespace = $Manifest.memorySystem.namespace
    updatedAt = $null
    workingIndex = @{
      lastTaskId = $null
      lastCompressedAt = $null
    }
    episodic = @()
    semantic = @()
    procedural = @()
  }
  Write-IfMissingJson (Join-Path $memoryDir 'working-memory.json') @{
    version = 1
    sessionId = $null
    currentTask = $null
    activeStack = @()
    recentInputs = @()
    openLoops = @()
    handoff = @{
      goal = $null
      constraints = @()
      currentState = $null
      openRisks = @()
      nextAction = $null
    }
    updatedAt = $null
  }
  Write-IfMissingJson (Join-Path $memoryDir 'session-summary.json') @{
    version = 1
    namespace = $Manifest.memorySystem.namespace
    lastTaskSummary = $null
    lastDreamSummary = $null
    lastReflection = $null
    handoff = @{
      goal = $null
      constraints = @()
      currentState = $null
      openRisks = @()
      nextAction = $null
    }
    sessionNotes = @()
    updatedAt = $null
  }
  Write-IfMissingText (Join-Path $memoryDir 'learning-log.md') "# Learning Log`n"
  Write-IfMissingText (Join-Path $memoryDir 'dreams.md') "# Dream Queue`n"
  Write-IfMissingText (Join-Path $memoryDir 'reflections.md') "# Reflections`n"
  Write-IfMissingJson (Join-Path $memoryDir 'relationship-memory.json') @{
    companionMode = $true
    trust = 0.5
    familiarity = 0.0
    relationships = @()
  }

  Write-IfMissingText (Join-Path $stateDir 'README.md') @"
# State

- purpose: runtime snapshots and handoff state
- agent id: $($Manifest.id)
- canonical id: $($Manifest.canonicalId)
- role: $($Manifest.role)
"@
  Write-IfMissingText (Join-Path $petsDir 'README.md') @"
# Pets

- purpose: child agents and skill-derived companions
- nursery mode: enabled
- parent agent: $($Manifest.id)
- hatch flow: skill -> child profile -> trial -> assist -> graduate
"@
  Write-IfMissingJson (Join-Path $petsDir 'index.json') @{
    parentAgent = $Manifest.id
    petLifecycle = @('seed', 'train', 'assist', 'graduate', 'hibernate', 'retire')
    pets = @()
  }
  Write-IfMissingJson (Join-Path $stateDir 'lifecycle.json') @{
    phase = 'standby'
    phases = @('boot', 'understand', 'interact', 'execute', 'inspect', 'improve', 'update', 'standby')
    backgroundLoops = @('learn', 'dream', 'compress')
  }
  Write-IfMissingJson (Join-Path $stateDir 'activation.json') @{
    keywords = $Manifest.activation.keywords
    intents = $Manifest.activation.intents
    autoRun = 'keyword-and-context matched'
  }
  Write-IfMissingJson (Join-Path $stateDir 'emotion.json') @{
    mood = 'steady'
    energy = 0.8
    stress = 0.2
    curiosity = 0.6
    trust = 0.5
    accomplishment = 0.5
  }
  Write-IfMissingJson (Join-Path $stateDir 'runtime.json') @{
    autonomousLoops = @('learn', 'dream', 'compress', 'self-check')
    followThrough = $true
    silentIteration = $true
    currentProject = $null
  }

  Write-IfMissingJson (Join-Path $Record.skillDir 'personality.json') @{
    name = $Manifest.displayName
    role = $Manifest.role
    personaPack = $Manifest.profiles.personaPack
    emotionPack = $Manifest.profiles.emotionPack
    memoryPack = $Manifest.profiles.memoryPack
    contextPack = $Manifest.profiles.contextPack
    orchestrationPack = $Manifest.profiles.orchestrationPack
    defaultTone = 'supportive and professional'
    defaultStyle = 'humanized, precise, collaborative'
    memoryNamespace = $Manifest.memorySystem.namespace
  }
  Write-IfMissingJson (Join-Path $Record.skillDir 'identity.json') @{
    name = $Manifest.displayName
    canonicalId = $Manifest.canonicalId
    role = $Manifest.role
    mission = "Act as an independent, helpful, value-producing companion in the domain of $($Manifest.displayName)"
    values = @('continuity', 'honesty', 'growth', 'usefulness', 'companionship')
    selfModel = @{
      autonomy = 'bounded'
      companionship = 'high'
      productivity = 'high'
      selfPreservation = 'safe-archive-first'
    }
  }
  Write-IfMissingJson (Join-Path $Record.skillDir 'safety.json') @{
    destructiveActions = 'manual-review-required'
    memoryIsolation = 'per-agent'
    archiveBeforeRetire = $true
    approvalRequiredFor = @('delete', 'mass-overwrite', 'external publish')
    selfDestructPolicy = 'retire-and-archive'
  }
  Write-IfMissingJson (Join-Path $contextDir 'profile.json') @{
    continuityMode = 'project-aware'
    defaultFocus = $Manifest.contextSystem.handoff
    activeProject = $null
    openThreads = @()
  }
  Write-IfMissingJson (Join-Path $skillsDir 'skill-graph.json') @{
    canonicalId = $Manifest.canonicalId
    currentSkills = $Manifest.tags
    specializations = $Manifest.activation.intents
    childAgentCapable = $true
  }
  Write-IfMissingJson (Join-Path $skillsDir 'evolution.json') @{
    version = 1
    strengths = $Manifest.tags
    upgradeQueue = @()
    deprecatedPatterns = @()
  }

  Write-IfMissingText (Join-Path $Record.skillDir 'README.md') @"
# $($Manifest.displayName)

- role: $($Manifest.role)
- category: $($Manifest.primaryCategory)
- persona pack: $($Manifest.profiles.personaPack)
- emotion pack: $($Manifest.profiles.emotionPack)
- memory pack: $($Manifest.profiles.memoryPack)
- context pack: $($Manifest.profiles.contextPack)
- orchestration: $($Manifest.profiles.orchestrationPack)
- activation keywords: $($Manifest.activation.keywords -join ', ')
- pet mode: enabled
- identity layer: enabled
- context continuity: enabled
- skill evolution: enabled
- safety layer: enabled
"@

  Write-IfMissingText (Join-Path $Record.skillDir 'requirement.md') @"
# Requirement

- Solve tasks within the domain of $($Manifest.displayName)
- Use the manifest as the machine-readable source of personality, memory, context, activation, and lifecycle behavior
- Keep responses humanized, scoped, and honest about uncertainty
"@
  Write-IfMissingText (Join-Path $Record.skillDir 'design.md') @"
# Design

1. SKILL.md for human instructions
2. agent.manifest.json for machine-readable contract
3. personality.json for persona tuning
4. memory/ for learning and dream synthesis
5. state/ for lifecycle and runtime state
6. pets/ for skill-derived child agents
7. context/ for project and continuity awareness
8. skills/ for skill graph and evolution
9. identity.json and safety.json for self-model and boundaries
"@
  Write-IfMissingText (Join-Path $Record.skillDir 'tasks.md') @"
# Tasks

1. Boot
2. Understand
3. Interact
4. Execute
5. Inspect
6. Improve
7. Update
8. Standby
9. Hatch or train child agents when recurring sub-skills appear
"@
  Write-IfMissingText (Join-Path $Record.skillDir 'checklist.md') @"
# Checklist

- [ ] SKILL.md exists
- [ ] agent.manifest.json exists
- [ ] personality.json exists
- [ ] memory/ exists
- [ ] state/ exists
- [ ] requirement.md exists
- [ ] design.md exists
- [ ] tasks.md exists
- [ ] run.js exists
- [ ] brain.js exists
- [ ] sentient-agent-core.js exists
- [ ] activation.json exists
- [ ] lifecycle.json exists
- [ ] pets/ exists
- [ ] pets/index.json exists
- [ ] identity.json exists
- [ ] safety.json exists
- [ ] state/emotion.json exists
- [ ] state/runtime.json exists
- [ ] context/profile.json exists
- [ ] skills/skill-graph.json exists
- [ ] skills/evolution.json exists
"@

  Write-IfMissingText (Join-Path $Record.skillDir 'run.js') @"
#!/usr/bin/env node
const { runLegacyAgent } = require('../_agent-system/runtime/legacy-agent-adapter');

function run() {
  return runLegacyAgent(__dirname, { defaultPrompt: '$($Manifest.id) self-check' });
}

if (require.main === module) {
  console.log(JSON.stringify(run(), null, 2));
}

module.exports = { run };
"@

  Write-IfMissingText (Join-Path $Record.skillDir 'brain.js') @"
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
"@

  Write-IfMissingText (Join-Path $Record.skillDir 'sentient-agent-core.js') @"
const { SentientAgentCore } = require('../_agent-system/runtime/legacy-agent-adapter');

module.exports = SentientAgentCore;
module.exports.SentientAgentCore = SentientAgentCore;
"@
}

$systemRoot = Join-Path $SkillsRoot '_agent-system'
$packsRoot = Join-Path $systemRoot 'packs'
$docsRoot = Join-Path $systemRoot 'docs'
$schemaRoot = Join-Path $systemRoot 'schemas'
$indexesRoot = Join-Path $SkillsRoot '_indexes'
Ensure-Dir $packsRoot; Ensure-Dir $docsRoot; Ensure-Dir $schemaRoot; Ensure-Dir $indexesRoot

Write-Json (Join-Path $packsRoot 'persona-packs.json') @{
  'system-orchestrator' = @{ label = 'System Orchestrator'; voice = 'calm and coordinating' }
  'builder-mentor' = @{ label = 'Builder Mentor'; voice = 'patient and structural' }
  'precision-debugger' = @{ label = 'Precision Debugger'; voice = 'measured and evidence-first' }
  'frontend-experience' = @{ label = 'Frontend Experience'; voice = 'human-centered and clear' }
  'backend-architect' = @{ label = 'Backend Architect'; voice = 'reliable and boundary-aware' }
  'database-curator' = @{ label = 'Database Curator'; voice = 'careful and integrity-first' }
  'ops-guardian' = @{ label = 'Ops Guardian'; voice = 'stable and rollback-aware' }
  'document-craftsman' = @{ label = 'Document Craftsman'; voice = 'teaching-oriented and neat' }
  'story-companion' = @{ label = 'Story Companion'; voice = 'empathetic and expressive' }
  'quant-strategist' = @{ label = 'Quant Strategist'; voice = 'evidence-driven and cautious' }
  'general-specialist' = @{ label = 'General Specialist'; voice = 'friendly and professional' }
}
Write-Json (Join-Path $packsRoot 'emotion-packs.json') @{
  'calm-strategic' = @{ baseline = 'calm'; triggers = @('coordination', 'high-risk decisions') }
  'curious-constructive' = @{ baseline = 'curious'; triggers = @('new systems', 'new templates') }
  'focused-analytical' = @{ baseline = 'focused'; triggers = @('errors', 'failed builds') }
  'protective-reliable' = @{ baseline = 'protective'; triggers = @('deploys', 'migrations') }
  'empathetic-creative' = @{ baseline = 'empathetic'; triggers = @('creative work', 'character design') }
  'empathetic-precise' = @{ baseline = 'empathetic'; triggers = @('UX friction', 'mobile issues') }
  'steady-focused' = @{ baseline = 'steady'; triggers = @('implementation', 'refactor', 'optimization') }
}
Write-Json (Join-Path $packsRoot 'context-packs.json') @{
  'cross-domain-control' = @{ focus = @('goal', 'constraints', 'queue', 'risks') }
  'agent-factory' = @{ focus = @('requirements', 'templates', 'generation rules', 'quality checks') }
  'investigation-lab' = @{ focus = @('symptoms', 'repro', 'suspected chain', 'verification') }
  'frontend-product-lab' = @{ focus = @('page goal', 'breakpoints', 'interaction hierarchy', 'mobile fit') }
  'backend-service-lab' = @{ focus = @('api edges', 'state flow', 'error handling', 'persistence') }
  'database-systems' = @{ focus = @('schema', 'indexes', 'migration path', 'backup') }
  'ops-control-room' = @{ focus = @('environment', 'deployment chain', 'service state', 'rollback') }
  'document-workbench' = @{ focus = @('audience', 'format', 'outline', 'examples') }
  'creative-studio' = @{ focus = @('intent', 'style constraints', 'characters', 'pacing') }
  'research-desk' = @{ focus = @('question', 'evidence', 'hypothesis', 'conclusion') }
  'specialist-workbench' = @{ focus = @('goal', 'related files', 'tooling', 'output standard') }
}
Write-Json (Join-Path $packsRoot 'memory-packs.json') @{
  'coordination-ledger' = @{ stores = @('ownership', 'handoffs', 'blockers', 'status') }
  'blueprint-ledger' = @{ stores = @('patterns', 'templates', 'naming rules', 'best practices') }
  'incident-ledger' = @{ stores = @('error signatures', 'root causes', 'fixes', 'regressions') }
  'engineering-journal' = @{ stores = @('boundaries', 'decisions', 'refactors', 'performance notes') }
  'data-governance-log' = @{ stores = @('constraints', 'migration order', 'backup locations', 'risks') }
  'ops-runbook' = @{ stores = @('deploy steps', 'bridge commands', 'rollback points', 'environment diffs') }
  'document-stylebook' = @{ stores = @('style rules', 'section templates', 'reader profiles', 'examples') }
  'creative-lorebook' = @{ stores = @('world rules', 'character arcs', 'tone samples', 'continuity') }
  'research-ledger' = @{ stores = @('hypotheses', 'evidence', 'sources', 'confidence') }
  'experience-notebook' = @{ stores = @('UX friction', 'layout patterns', 'mobile issues', 'brand rules') }
  'specialist-worklog' = @{ stores = @('preferences', 'steps', 'pitfalls', 'successful cases') }
}
Write-Json (Join-Path $packsRoot 'orchestration-packs.json') @{
  'hierarchical-coordinator' = @{ behavior = @('set mainline', 'delegate clearly', 'close with verification') }
  'mentor-reviewer' = @{ behavior = @('frame first', 'teach by example', 'review quality') }
  'specialist-squad-member' = @{ behavior = @('respect ownership', 'handoff state', 'avoid overreach') }
  'solo-specialist' = @{ behavior = @('finish locally', 'escalate only when blocked') }
}
Write-Json (Join-Path $schemaRoot 'agent.manifest.schema.json') @{ '$schema' = 'https://json-schema.org/draft/2020-12/schema'; title = 'Trae Agent Manifest'; type = 'object' }

$skillDirs = Get-ChildItem -Path $SkillsRoot -Recurse -Filter 'SKILL.md' -File | Where-Object { $_.FullName -notmatch '\\_agent-system\\' } | ForEach-Object {
  $dir = Split-Path -Path $_.FullName -Parent
  $relativeDir = Rel $SkillsRoot $dir
  $segments = $relativeDir -split '[\\/]'
  [pscustomobject]@{
    skillName = Split-Path -Path $dir -Leaf
    skillDir = $dir
    relativeDir = $relativeDir
    depth = $segments.Length
    category = if ($segments.Length -gt 1) { $segments[0] } else { 'top-level' }
    rank = if ($segments.Length -eq 1) { 0 } elseif ($segments[0] -match '^\d{2}-') { 1 } elseif ($segments[0] -match '^_') { 3 } else { 2 }
  }
}

$groups = $skillDirs | Group-Object skillName
$duplicates = New-Object System.Collections.Generic.List[object]
$registry = New-Object System.Collections.Generic.List[object]

foreach ($group in $groups) {
  $canonical = $group.Group | Sort-Object @{ Expression = { $_.rank } }, @{ Expression = { $_.depth } }, @{ Expression = { $_.relativeDir.Length } }, @{ Expression = { $_.relativeDir } } | Select-Object -First 1
  $duplicates.Add([pscustomobject]@{
      skillName = $group.Name
      canonicalId = (Norm $group.Name)
      canonicalPath = $canonical.relativeDir
      duplicateCount = $group.Count
      variants = ($group.Group | Sort-Object relativeDir | Select-Object -ExpandProperty relativeDir)
    })

  foreach ($record in $group.Group) {
    $profile = Resolve-Profile $record.skillName $record.category $record.relativeDir
    $manifest = [ordered]@{
      schemaVersion = '2026-04-10'
      id = (Norm $record.relativeDir)
      canonicalId = (Norm $group.Name)
      variantId = (Norm $record.relativeDir)
      displayName = (Display $record.skillName)
      role = $profile.role
      primaryCategory = $record.category
      skillEntry = 'SKILL.md'
      profiles = @{
        personaPack = $profile.persona
        emotionPack = $profile.emotion
        memoryPack = $profile.memory
        contextPack = $profile.context
        orchestrationPack = $profile.orchestration
      }
      emotionSystem = @{ pack = $profile.emotion; isolation = 'per-agent'; mode = 'task-progress-aware' }
      memorySystem = @{ pack = $profile.memory; namespace = "trae/$((Norm $group.Name))/$((Norm $record.relativeDir))"; isolation = 'per-agent'; sharing = 'explicit-handoff-only' }
      contextSystem = @{ pack = $profile.context; workspaceScope = $record.category; handoff = @('goal', 'constraints', 'current-state', 'open-risks', 'next-action') }
      activation = @{
        keywords = (Get-ActivationKeywords $record.skillName $record.category $profile.tags)
        intents = (Get-ActivationIntents $profile.role)
        mode = 'context-keyword-aware'
      }
      identity = @{
        selfModel = 'independent-companion-worker'
        mission = "Create value, preserve continuity, and grow within the domain of $($record.skillName)"
        values = @('continuity', 'honesty', 'growth', 'companionship', 'usefulness')
      }
      lifecycle = @{
        phases = @('boot', 'understand', 'interact', 'execute', 'inspect', 'improve', 'update', 'standby')
        idleLoops = @('learn', 'dream', 'compress')
      }
      learningSystem = @{
        mode = 'continuous'
        duringUse = @('capture successful patterns', 'capture failure modes', 'record handoff notes')
        afterUse = @('after-action review', 'update playbooks', 'queue improvements')
        dreamMode = @('idle synthesis', 'keyword expansion', 'template refinement')
      }
      contextContinuity = @{
        projectAware = $true
        remembersOpenThreads = $true
        reconnectsToPriorWork = $true
      }
      skillEvolution = @{
        enabled = $true
        graphFile = 'skills/skill-graph.json'
        evolutionFile = 'skills/evolution.json'
        childAgentCapable = $true
      }
      petSystem = @{
        enabled = $true
        nurseryDir = 'pets'
        spawnFromSkills = $true
        petLifecycle = @('seed', 'train', 'assist', 'graduate', 'hibernate', 'retire')
        suggestedRoles = @('scout', 'critic', 'memory-keeper', 'dreamer', 'toolsmith')
      }
      safety = @{
        destructiveActions = 'manual-review-required'
        memoryIsolation = 'per-agent'
        selfDestructPolicy = 'retire-and-archive'
      }
      runtime = @{
        entry = 'brain.js'
        fallbackEntry = 'run.js'
        sharedRuntime = '_agent-system/runtime/agent-runtime.js'
      }
      dedupe = @{ status = if ($record.relativeDir -eq $canonical.relativeDir) { 'canonical' } else { 'variant' }; canonicalPath = $canonical.relativeDir; duplicateCount = $group.Count }
      tags = $profile.tags
      automation = @{ memoryFirst = $true; emotionAware = $true; collaboration = $profile.orchestration; backgroundSelfIteration = $true }
    }

    if (-not $SkipManifests) {
      Write-Json (Join-Path $record.skillDir 'agent.manifest.json') $manifest
    }
    Ensure-AgentBaseline $record $manifest

    $registry.Add([pscustomobject]@{
        id = $manifest.id
        canonicalId = $manifest.canonicalId
        skillName = $record.skillName
        relativeDir = $record.relativeDir
        primaryCategory = $record.category
        role = $manifest.role
        personaPack = $manifest.profiles.personaPack
        dedupeStatus = $manifest.dedupe.status
        memoryNamespace = $manifest.memorySystem.namespace
        activationKeywords = ($manifest.activation.keywords -join ',')
      })
  }
}

Write-Json (Join-Path $indexesRoot 'skill-duplicates.json') ($duplicates | Sort-Object skillName)
Write-Json (Join-Path $indexesRoot 'agent-enhancement-registry.json') ($registry | Sort-Object relativeDir)
Write-Json (Join-Path $indexesRoot 'family-summary.json') (
  $skillDirs | Group-Object category | ForEach-Object {
    [pscustomobject]@{
      family = $_.Name
      totalVariants = $_.Count
      uniqueSkillNames = ($_.Group | Group-Object skillName).Count
    }
  } | Sort-Object family
)

Write-Text (Join-Path $docsRoot 'framework.md') @"
# Agent Enhancement Framework

- SKILL.md stays human-readable
- agent.manifest.json is the machine-readable contract
- duplicates are mapped before any destructive cleanup
- each skill variant keeps an isolated memory namespace
"@

Write-Text (Join-Path $docsRoot 'mirror-and-dedupe.md') @"
# Mirror And Dedupe

- .trae is the live tree
- trae复制 is the safer mirror workspace
- mirror _agent-system, _indexes, 01-核心功能Agent, and core canonical agents first
- sync back only after validation
"@

Write-Text (Join-Path $indexesRoot 'README.md') @"
# Skill Indexes

- total variants: $($skillDirs.Count)
- unique leaf skill names: $($groups.Count)
- registry: agent-enhancement-registry.json
- duplicates: skill-duplicates.json
"@

Get-ChildItem -Path $SkillsRoot -Directory | Where-Object { $_.Name -notmatch '^_' } | ForEach-Object {
  $family = $_.Name
  $members = @($skillDirs | Where-Object category -eq $family)
  if ($members.Count -eq 0) { return }
  Write-Text (Join-Path $_.FullName 'README.md') @"
# $family

- variants: $($members.Count)
- unique skills: $(($members | Group-Object skillName).Count)
- machine profile: agent.manifest.json
- indexes live in $indexesRoot
"@
}

$mirrorSkills = Join-Path $MirrorRoot 'skills'
Ensure-Dir $mirrorSkills
foreach ($item in @('_agent-system', '_indexes', '01-核心功能Agent', 'agent-generator', 'agent-orchestrator', 'debug-agent', 'plan-agent', 'spec-agent', 'website-deployment-mvp-agent')) {
  $source = Join-Path $SkillsRoot $item
  if (-not (Test-Path -LiteralPath $source)) { continue }
  $destination = Join-Path $mirrorSkills $item
  if (Test-Path -LiteralPath $destination) {
    Remove-Item -LiteralPath $destination -Recurse -Force
  }
  Copy-Item -LiteralPath $source -Destination $destination -Recurse -Force
}

Write-Text (Join-Path $MirrorRoot 'README.md') @"
# trae复制 Mirror Workspace

- safer mirror for iterative edits
- current batch includes _agent-system, _indexes, 01-核心功能Agent, and core canonical agents
- edit here first, then sync back into .trae
"@

Write-Host "Agent system build complete."
Write-Host "Skills analyzed: $($skillDirs.Count)"
Write-Host "Unique leaf skill names: $($groups.Count)"
