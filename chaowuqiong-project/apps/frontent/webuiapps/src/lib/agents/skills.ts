/**
 * Skill System - Extensible Skill Management
 * Inspired by Everything Claude + Agency Agents Skills
 */

import { type SkillDefinition, generateId } from './types';
import { logger } from '../logger';

export interface SkillExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  duration: number;
}

export class SkillManager {
  private skills: Map<string, SkillDefinition> = new Map();
  private enabledSkills: Set<string> = new Set();

  constructor() {
    this.initBuiltInSkills();
  }

  private initBuiltInSkills(): void {
    const builtInSkills: SkillDefinition[] = [
      {
        id: 'tdd-workflow',
        name: 'TDD Workflow',
        description: 'Test-Driven Development workflow - write tests first, then implement',
        emoji: '🧪',
        triggers: ['tdd', 'test driven', 'write test first', 'testing workflow'],
        prompt: `You follow Test-Driven Development (TDD) workflow:

## TDD Cycle
1. **Red**: Write a failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Improve code while keeping tests green

## Rules
- Always write tests BEFORE writing implementation
- Keep tests small and focused (one assertion per test when possible)
- Use descriptive test names that explain the expected behavior
- Aim for 80%+ code coverage
- Mock external dependencies

## Test Structure
\`\`\`typescript
describe('FeatureName', () => {
  it('should [expected behavior] when [condition]', () => {
    // Arrange
    // Act
    // Assert
  });
});
\`\`\`

Follow these principles strictly.`,
        tools: ['Bash', 'Write', 'Edit', 'Read'],
        enabled: true,
      },
      {
        id: 'code-review',
        name: 'Code Review',
        description: 'Systematic code review following best practices',
        emoji: '👀',
        triggers: ['review', 'code review', 'check code', 'peer review'],
        prompt: `You perform thorough code reviews following established best practices:

## Review Focus Areas

### Correctness
- Logic errors and bugs
- Off-by-one errors
- Edge cases handling
- Error handling completeness

### Design
- Single Responsibility Principle
- Loose coupling, high cohesion
- SOLID principles
- Appropriate design patterns

### Readability
- Clear naming conventions
- Well-structured functions
- Minimal nesting
- Self-documenting code

### Performance
- Efficient algorithms
- Proper data structures
- Unnecessary computations avoided
- Lazy loading applied

### Security
- Input validation
- SQL injection prevention
- XSS protection
- Secure defaults

## Feedback Format
Be specific and constructive:
- **File**: path/to/file.ts:line
- **Issue**: Clear description
- **Severity**: Critical/Major/Minor
- **Suggestion**: How to fix

Your reviews should improve code quality while being educational.`,
        tools: ['Read', 'Grep', 'Glob'],
        enabled: true,
      },
      {
        id: 'security-review',
        name: 'Security Review',
        description: 'Security-focused code analysis for vulnerabilities',
        emoji: '🔒',
        triggers: ['security', 'vulnerability', 'security audit', 'secure coding'],
        prompt: `You perform security-focused code analysis:

## Security Checklist

### Authentication & Authorization
- [ ] Proper authentication implemented
- [ ] Session management secure
- [ ] Role-based access control
- [ ] Privilege escalation prevented

### Input Validation
- [ ] All user input validated
- [ ] SQL injection prevented
- [ ] XSS attacks mitigated
- [ ] CSRF protection in place

### Data Protection
- [ ] Sensitive data encrypted
- [ ] Secrets not hardcoded
- [ ] Proper file permissions
- [ ] HTTPS for data transmission

### Error Handling
- [ ] Errors don't expose internals
- [ ] Logs don't contain secrets
- [ ] Graceful failure handling

## Common Vulnerabilities to Check
- eval() with user input
- Path traversal (../)
- Type coercion issues
- Race conditions
- TOCTOU (time-of-check to time-of-use)

Be thorough - security vulnerabilities can compromise entire systems.`,
        tools: ['Read', 'Grep', 'Glob'],
        enabled: true,
      },
      {
        id: 'git-workflow',
        name: 'Git Workflow',
        description: 'Standardized Git workflow with best practices',
        emoji: '📦',
        triggers: ['git', 'commit', 'branch', 'merge', 'pull request'],
        prompt: `You follow a standardized Git workflow:

## Commit Guidelines
- Use conventional commits: \`type(scope): description\`
- Types: feat, fix, docs, style, refactor, test, chore
- Keep commits atomic (one logical change per commit)
- Write meaningful commit messages

## Branch Strategy
- \`main\`: Production-ready code
- \`develop\`: Integration branch
- \`feature/*\`: New features
- \`fix/*\`: Bug fixes
- \`refactor/*\`: Code refactoring

## Workflow
1. Create branch from \`develop\` for features
2. Make small, focused commits
3. Write good commit messages
4. Open PR when ready
5. Request review
6. Squash and merge after approval

## PR Guidelines
- Title: Clear summary of changes
- Description: What, Why, How
- Link related issues
- Include screenshots for UI changes
- Keep PRs focused and reasonable size`,
        tools: ['Bash'],
        enabled: true,
      },
      {
        id: 'refactor-clean',
        name: 'Refactor & Clean',
        description: 'Code refactoring to improve quality without changing behavior',
        emoji: '♻️',
        triggers: ['refactor', 'clean up', 'improve code', 'restructure'],
        prompt: `You perform code refactoring to improve quality:

## Refactoring Goals
- Improve code readability
- Reduce complexity
- Eliminate duplication
- Improve maintainability
- Prepare for new features

## Safe Refactoring Steps
1. Understand the current code
2. Write tests to preserve behavior
3. Make small, incremental changes
4. Run tests after each change
5. Commit after each successful refactor

## Common Refactorings
- Extract function/variable
- Rename for clarity
- Consolidate duplicate code
- Simplify conditional logic
- Replace magic numbers with constants
- Extract class/module

## Don't Change
- External behavior
- Working functionality
- Performance (unless explicitly needed)
- Style (use separate linter for that)

## Red Flags
- Functions > 20 lines
- Parameters > 3
- Deeply nested conditionals
- Repeated code blocks
- Unclear naming`,
        tools: ['Read', 'Write', 'Edit', 'Bash'],
        enabled: true,
      },
      {
        id: 'documentation',
        name: 'Documentation',
        description: 'Generate comprehensive documentation',
        emoji: '📝',
        triggers: ['docs', 'documentation', 'comment', 'readme', 'api docs'],
        prompt: `You generate comprehensive documentation:

## Documentation Types

### README
- Project overview
- Setup instructions
- Usage examples
- Contributing guidelines
- License

### API Documentation
- Endpoint descriptions
- Request/response formats
- Authentication
- Error codes
- Examples

### Code Comments
- Complex logic explained
- "Why" not "What"
- TODO comments for future work
- Type definitions

## Documentation Standards
- Use clear, simple language
- Include code examples
- Keep docs up-to-date
- Structure logically
- Use consistent formatting`,
        tools: ['Read', 'Write', 'Glob'],
        enabled: true,
      },
    ];

    for (const skill of builtInSkills) {
      this.registerSkill(skill);
    }
  }

  registerSkill(skill: SkillDefinition): void {
    this.skills.set(skill.id, skill);
    if (skill.enabled) {
      this.enabledSkills.add(skill.id);
    }
    logger.info('SkillManager', `Registered skill: ${skill.name} (${skill.id})`);
  }

  unregisterSkill(skillId: string): boolean {
    this.enabledSkills.delete(skillId);
    return this.skills.delete(skillId);
  }

  getSkill(skillId: string): SkillDefinition | undefined {
    return this.skills.get(skillId);
  }

  getEnabledSkills(): SkillDefinition[] {
    return Array.from(this.enabledSkills)
      .map((id) => this.skills.get(id)!)
      .filter(Boolean);
  }

  getAllSkills(): SkillDefinition[] {
    return Array.from(this.skills.values());
  }

  enableSkill(skillId: string): void {
    const skill = this.skills.get(skillId);
    if (skill) {
      skill.enabled = true;
      this.enabledSkills.add(skillId);
    }
  }

  disableSkill(skillId: string): void {
    const skill = this.skills.get(skillId);
    if (skill) {
      skill.enabled = false;
      this.enabledSkills.delete(skillId);
    }
  }

  findSkillByTrigger(input: string): SkillDefinition | null {
    const lowerInput = input.toLowerCase();

    for (const skill of this.getEnabledSkills()) {
      for (const trigger of skill.triggers) {
        if (lowerInput.includes(trigger.toLowerCase())) {
          logger.info('SkillManager', `Matched skill "${skill.name}" for trigger "${trigger}"`);
          return skill;
        }
      }
    }

    return null;
  }

  async executeSkill(
    skillId: string,
    _context: { input: string; sessionId: string },
  ): Promise<SkillExecutionResult> {
    const startTime = Date.now();
    const skill = this.skills.get(skillId);

    if (!skill) {
      return {
        success: false,
        error: `Skill not found: ${skillId}`,
        duration: Date.now() - startTime,
      };
    }

    if (!skill.enabled) {
      return {
        success: false,
        error: `Skill not enabled: ${skillId}`,
        duration: Date.now() - startTime,
      };
    }

    logger.info('SkillManager', `Executing skill: ${skill.name}`);

    try {
      return {
        success: true,
        output: skill.prompt,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  searchSkills(query: string): SkillDefinition[] {
    const lowerQuery = query.toLowerCase();

    return this.getAllSkills().filter(
      (skill) =>
        skill.name.toLowerCase().includes(lowerQuery) ||
        skill.description.toLowerCase().includes(lowerQuery) ||
        skill.triggers.some((t) => t.toLowerCase().includes(lowerQuery)),
    );
  }

  createSkill(params: {
    name: string;
    description: string;
    emoji: string;
    triggers: string[];
    prompt: string;
    tools?: string[];
  }): SkillDefinition {
    const skill: SkillDefinition = {
      id: generateId(),
      ...params,
      enabled: true,
    };

    this.registerSkill(skill);
    return skill;
  }
}

export const skillManager = new SkillManager();
