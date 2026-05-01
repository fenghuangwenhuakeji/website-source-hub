export type DesktopAppKind = 'system' | 'special' | 'legacy' | 'generated';

export type DesktopAppRuntime = 'component' | 'generated-web' | 'static-web' | 'native-exe';

export type FrontendSourceMode = 'html-entry' | 'module-entry';

export type ExperienceProfileId = 'chat' | 'agent' | 'code-edit' | 'writing' | 'fenghuang';

export type MobilePriority = 'primary' | 'secondary' | 'utility';

export interface DesktopSourceFile {
  path: string;
  content: string;
  language: 'html' | 'css' | 'javascript' | 'typescript' | 'json' | 'text';
}

export interface FrontendBundleInfo {
  mode: FrontendSourceMode;
  entryFile: string;
  html: string;
  notes: string[];
  files: DesktopSourceFile[];
  compilerVersion?: string;
}

export interface NativeExecutableInfo {
  executablePath: string;
  workingDirectory?: string;
  launcherPath?: string;
  sourceRoot?: string;
  launchArgs?: string[];
  notes?: string[];
}

export interface DesktopAppDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  width: number;
  height: number;
  kind: DesktopAppKind;
  runtime: DesktopAppRuntime;
  componentKey?: string;
  route?: string;
  installedAt?: number;
  tags?: string[];
  experienceProfileId?: ExperienceProfileId;
  experienceHighlights?: string[];
  activationKeywords?: string[];
  mobilePriority?: MobilePriority;
  bundle?: FrontendBundleInfo;
  native?: NativeExecutableInfo;
}

export interface GeneratedDesktopAppInput {
  title: string;
  description: string;
  icon: string;
  color: string;
  width: number;
  height: number;
  sourceFiles: DesktopSourceFile[];
}

export interface NativeDesktopAppInput {
  title: string;
  description: string;
  icon: string;
  color: string;
  width: number;
  height: number;
  executablePath: string;
  workingDirectory?: string;
  launcherPath?: string;
  sourceRoot?: string;
  launchArgs?: string[];
}
