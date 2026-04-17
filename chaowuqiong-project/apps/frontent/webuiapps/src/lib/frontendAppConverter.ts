import type { DesktopSourceFile, FrontendBundleInfo } from '@/types/desktopApp';
import { createStorageBridgeScript, injectStorageBridge } from './storageBridge';

export const FRONTEND_BUNDLE_VERSION = '2026-04-11-5';

const logFrontendConverter = (...args: unknown[]) => {
  if (typeof window === 'undefined') return;
  console.info('[frontendConverter]', ...args);
};
const warnFrontendConverter = (...args: unknown[]) => {
  if (typeof window === 'undefined') return;
  console.warn('[frontendConverter]', ...args);
};

const MODULE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const STYLE_EXTENSIONS = ['.css'];
const HTML_EXTENSIONS = ['.html', '.htm'];

const normalizeFilePath = (value: string): string =>
  value
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '')
    .replace(/\/{2,}/g, '/');

const getFileExtension = (path: string): string => {
  const normalized = normalizeFilePath(path);
  const dotIndex = normalized.lastIndexOf('.');
  return dotIndex >= 0 ? normalized.slice(dotIndex).toLowerCase() : '';
};

const getDirectoryPath = (path: string): string => {
  const normalized = normalizeFilePath(path);
  const slashIndex = normalized.lastIndexOf('/');
  return slashIndex >= 0 ? normalized.slice(0, slashIndex) : '';
};

const shouldTranspileFile = (file: DesktopSourceFile): boolean =>
  file.language === 'typescript' || file.language === 'javascript';

const resolveRelativePath = (fromPath: string, specifier: string): string => {
  const sourceParts = getDirectoryPath(fromPath).split('/').filter(Boolean);
  const targetParts = specifier.split('/').filter(Boolean);

  for (const part of targetParts) {
    if (part === '.') continue;
    if (part === '..') {
      sourceParts.pop();
      continue;
    }
    sourceParts.push(part);
  }

  return sourceParts.join('/');
};

const detectLanguage = (path: string): DesktopSourceFile['language'] => {
  const ext = getFileExtension(path);
  if (HTML_EXTENSIONS.includes(ext)) return 'html';
  if (STYLE_EXTENSIONS.includes(ext)) return 'css';
  if (ext === '.ts' || ext === '.tsx') return 'typescript';
  if (ext === '.js' || ext === '.jsx') return 'javascript';
  if (ext === '.json') return 'json';
  return 'text';
};

const toSourceFileMap = (files: DesktopSourceFile[]): Map<string, DesktopSourceFile> =>
  new Map(files.map((file) => [normalizeFilePath(file.path), { ...file, path: normalizeFilePath(file.path) }]));

const resolveLocalReference = (fromPath: string, specifier: string, files: Map<string, DesktopSourceFile>): string | null => {
  const normalized = normalizeFilePath(specifier);

  const directCandidates = normalized.startsWith('.')
    ? [resolveRelativePath(fromPath, normalized)]
    : [normalized];

  const candidates = new Set<string>(directCandidates);
  for (const candidate of directCandidates) {
    for (const ext of [...MODULE_EXTENSIONS, ...STYLE_EXTENSIONS, ...HTML_EXTENSIONS]) {
      candidates.add(`${candidate}${ext}`);
    }
    for (const ext of MODULE_EXTENSIONS) {
      candidates.add(`${candidate}/index${ext}`);
    }
  }

  for (const candidate of candidates) {
    if (files.has(candidate)) return candidate;
  }

  return null;
};

const encodeDataUrl = (content: string, mime = 'text/javascript'): string => {
  const encoded = btoa(unescape(encodeURIComponent(content)));
  return `data:${mime};base64,${encoded}`;
};

const replaceAsync = async (
  source: string,
  matcher: RegExp,
  replacer: (...args: string[]) => Promise<string>,
): Promise<string> => {
  const tasks: Array<Promise<string>> = [];
  source.replace(matcher, (...args) => {
    tasks.push(replacer(...(args as string[])));
    return '';
  });
  const replacements = await Promise.all(tasks);
  let index = 0;
  return source.replace(matcher, () => replacements[index++]);
};

const shouldProcessInlineScript = (attrs: string): boolean => {
  if (/src\s*=/i.test(attrs)) return false;
  const typeMatch = attrs.match(/type\s*=\s*["']([^"']+)["']/i);
  if (!typeMatch) return true;
  const typeValue = typeMatch[1].toLowerCase();
  return typeValue.includes('javascript') || typeValue.includes('ecmascript') || typeValue === 'module' || typeValue === '';
};

const repairInlineScript = (content: string): string => {
  let output = content;
  output = output.replace(/\?\s*(['"])block\1\s*=\s*(['"])flex\2\s*:/g, "? 'block' :");
  return output;
};

const createDesktopRuntimeScript = (entryFile: string, notes: string[]): string => `
const __fenghuangDesktopRuntime = {
  entryFile: ${JSON.stringify(entryFile)},
  notes: ${JSON.stringify(notes)},
  version: '1.0.0',
  notify(message) {
    window.parent?.postMessage({ type: 'desktop-app-message', payload: message }, '*');
  }
};
window.FenghuangDesktopApp = __fenghuangDesktopRuntime;
window.ChaowuDesktopApp = __fenghuangDesktopRuntime;
`;

const createHtmlShell = (body: string, styles: string, scripts: string, title: string): string => `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(255, 204, 170, 0.26), transparent 30%),
          radial-gradient(circle at bottom right, rgba(255, 233, 214, 0.28), transparent 28%),
          linear-gradient(180deg, #fffaf6 0%, #fff1e8 100%);
      }
      html, body { min-height: 100%; background: #fff7f0; }
      body { margin: 0; min-height: 100dvh; background: inherit; }
      #app { min-height: 100dvh; background: inherit; }
      ${styles}
    </style>
  </head>
  <body>
    ${body}
    ${scripts}
  </body>
</html>`;

const inlineHtmlEntry = async (
  entryFile: DesktopSourceFile,
  files: Map<string, DesktopSourceFile>,
  notes: string[],
): Promise<string> => {
  let html = entryFile.content;
  const styleBlocks: string[] = [];

  html = html.replace(/<link([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi, (full, before, href, after) => {
    const target = resolveLocalReference(entryFile.path, href, files);
    if (!target) return full;
    const file = files.get(target);
    if (!file || file.language !== 'css') return full;
    styleBlocks.push(`/* ${target} */\n${file.content}`);
    notes.push(`Inlined style file ${target}`);
    return '';
  });

  if (styleBlocks.length > 0) {
    html = html.replace('</head>', `<style>\n${styleBlocks.join('\n\n')}\n</style>\n</head>`);
  }

  html = html.replace(
    /<script([^>]*)>([\s\S]*?)<\/script>/gi,
    (full, attrs: string, scriptContent: string) => {
      if (!shouldProcessInlineScript(attrs)) return full;
      const repaired = repairInlineScript(scriptContent);
      const safeRepaired = repaired.replace(/<\/script>/gi, '<\\/script>');
      return `<script${attrs}>${safeRepaired}<\/script>`;
    },
  );

  html = await replaceAsync(
    html,
    /<script([^>]*?)src=["']([^"']+)["']([^>]*)><\/script>/gi,
    async (full, before, src, after) => {
      const target = resolveLocalReference(entryFile.path, src, files);
      if (!target) return full;
      const file = files.get(target);
      if (!file || (file.language !== 'javascript' && file.language !== 'typescript')) return full;
      const compiled = shouldTranspileFile(file)
        ? await transpileScript(file.path, file.content)
        : file.content;
      const safeCompiled = compiled.replace(/<\/script>/gi, '<\\/script>');
      notes.push(`Inlined script file ${target}`);
      return `<script${before}${after}>${safeCompiled}<\/script>`;
    },
  );

  return injectStorageBridge(html, notes);
};

const transpileScript = async (filePath: string, content: string): Promise<string> => {
  const ts = await import('typescript');
  const output = ts.transpileModule(content, {
    fileName: filePath,
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      allowJs: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });

  return output.outputText;
};

const compileScriptFile = async (
  file: DesktopSourceFile,
  files: Map<string, DesktopSourceFile>,
  notes: string[],
): Promise<string> => {
  let code = file.content;
  if (shouldTranspileFile(file)) {
    code = await transpileScript(file.path, code);
    notes.push(`Transpiled script file ${file.path}`);
  }

  code = code.replace(/^\s*import\s+["'](.+?\.css)["'];?\s*$/gm, (_, specifier: string) => {
    const target = resolveLocalReference(file.path, specifier, files);
    if (!target) return '';
    const cssFile = files.get(target);
    if (!cssFile) return '';
    return `
const __style_${target.replace(/[^a-zA-Z0-9_]/g, '_')} = document.createElement('style');
__style_${target.replace(/[^a-zA-Z0-9_]/g, '_')}.textContent = ${JSON.stringify(cssFile.content)};
document.head.appendChild(__style_${target.replace(/[^a-zA-Z0-9_]/g, '_')});
`;
  });

  code = code.replace(/(from\s+["'])(.+?)(["'])/g, (full, start, specifier, end) => {
    if (!specifier.startsWith('.')) return full;
    const target = resolveLocalReference(file.path, specifier, files);
    if (!target) return full;
    return `${start}${`/__desktop__/${target}`}${end}`;
  });

  code = code.replace(/(import\s+["'])(.+?)(["'])/g, (full, start, specifier, end) => {
    if (!specifier.startsWith('.')) return full;
    const target = resolveLocalReference(file.path, specifier, files);
    if (!target) return full;
    if (getFileExtension(target) === '.css') return '';
    return `${start}${`/__desktop__/${target}`}${end}`;
  });

  return code;
};

const createModuleBundle = async (
  files: Map<string, DesktopSourceFile>,
  entryFile: DesktopSourceFile,
  notes: string[],
  title: string,
): Promise<string> => {
  const importMap: Record<string, string> = {};

  const cssFiles = Array.from(files.values()).filter((file) => file.language === 'css');
  const styles = cssFiles.map((file) => `/* ${file.path} */\n${file.content}`).join('\n\n');

  const scriptFiles = Array.from(files.values()).filter((file) =>
    file.language === 'javascript' || file.language === 'typescript',
  );

  for (const file of scriptFiles) {
    const compiled = await compileScriptFile(file, files, notes);
    importMap[`/__desktop__/${file.path}`] = encodeDataUrl(compiled);
  }

  notes.push('Injected storage bridge for sandboxed iframe.');
  const runtimeScript = createDesktopRuntimeScript(entryFile.path, notes);
  const storageBridge = createStorageBridgeScript();

  return createHtmlShell(
    '<div id="app"></div>',
    styles,
    `
      ${storageBridge}
      <script>${runtimeScript}<\/script>
      <script type="importmap">${JSON.stringify({ imports: importMap }, null, 2)}<\/script>
      <script type="module">
        import "/__desktop__/${entryFile.path}";
      <\/script>
    `,
    title,
  );
};

const pickHtmlEntry = (files: DesktopSourceFile[]): DesktopSourceFile | null =>
  files.find((file) => /^index\.html?$/i.test(file.path)) ??
  files.find((file) => file.language === 'html') ??
  null;

const pickModuleEntry = (files: DesktopSourceFile[]): DesktopSourceFile | null => {
  const candidates = [
    'main.ts',
    'main.tsx',
    'main.js',
    'main.jsx',
    'index.ts',
    'index.tsx',
    'index.js',
    'index.jsx',
    'app.ts',
    'app.tsx',
    'app.js',
    'app.jsx',
  ];
  for (const name of candidates) {
    const match = files.find((file) => file.path.toLowerCase() === name);
    if (match) return match;
  }
  return files.find((file) => file.language === 'typescript' || file.language === 'javascript') ?? null;
};

export async function buildFrontendBundle(
  rawFiles: DesktopSourceFile[],
  title: string,
): Promise<FrontendBundleInfo> {
  const files = rawFiles
    .map((file) => ({
      ...file,
      path: normalizeFilePath(file.path),
      language: file.language ?? detectLanguage(file.path),
    }))
    .filter((file) => file.path.length > 0);

  if (files.length === 0) {
    throw new Error('No source files to convert.');
  }

  logFrontendConverter('buildFrontendBundle start', {
    title,
    fileCount: files.length,
    samplePaths: files.slice(0, 8).map((file) => file.path),
    hasMore: files.length > 8,
  });

  const notes: string[] = [];
  const fileMap = toSourceFileMap(files);
  const htmlEntry = pickHtmlEntry(files);

  if (htmlEntry) {
    const html = await inlineHtmlEntry(htmlEntry, fileMap, notes);
    logFrontendConverter('buildFrontendBundle html-entry', {
      entryFile: htmlEntry.path,
      notes: notes.length,
      files: files.length,
      htmlLength: html.length,
    });
    return {
      mode: 'html-entry',
      entryFile: htmlEntry.path,
      html,
      notes,
      files,
      compilerVersion: FRONTEND_BUNDLE_VERSION,
    };
  }

  const moduleEntry = pickModuleEntry(files);
  if (!moduleEntry) {
    warnFrontendConverter('buildFrontendBundle missing entry', {
      title,
      fileCount: files.length,
      samplePaths: files.slice(0, 8).map((file) => file.path),
      hasMore: files.length > 8,
    });
    throw new Error('No entry file found. Provide index.html, main.ts, or main.js.');
  }

  const html = await createModuleBundle(fileMap, moduleEntry, notes, title);
  logFrontendConverter('buildFrontendBundle module-entry', {
    entryFile: moduleEntry.path,
    notes: notes.length,
    files: files.length,
    htmlLength: html.length,
  });
  return {
    mode: 'module-entry',
    entryFile: moduleEntry.path,
    html,
    notes,
    files,
    compilerVersion: FRONTEND_BUNDLE_VERSION,
  };
}

export function fileListToDesktopSources(files: Array<{ path: string; content: string }>): DesktopSourceFile[] {
  return files.map((file) => ({
    path: normalizeFilePath(file.path),
    content: file.content,
    language: detectLanguage(file.path),
  }));
}
