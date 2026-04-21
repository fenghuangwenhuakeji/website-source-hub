/**
 * File Operations API
 * File read/write interface wrapper based on @gui/vibe-container
 *
 * @gui/vibe-container provides the following file operation methods:
 * - manager.getFile(data)              → EventType.GetFile
 * - manager.listFiles(data)            → EventType.ListFiles
 * - manager.searchFiles(data)          → EventType.SearchFiles
 * - manager.putTextFilesByJSON(data)   → EventType.PutTextFilesByJSON
 * - manager.deleteFilesByPaths(data)   → EventType.DeleteFilesByPaths
 *
 * getFile uses file_path (full path) to read file content.
 * Other write operations are based on the TextFile structure:
 *   path:    folder path where the file resides (without leading slash), e.g. "posts", "a/b/c", "" (root)
 *   name:    file name, e.g. "tweet_123.json"
 *   content: file content (string)
 *
 * These methods internally use a request-response mechanism (messageId/requestId matching),
 * and the server returns FileOperationResponsePayload { statusCode, statusMsg, data }
 */

import { getClientComManager } from './vibeContainerMock';
import type { FileNode, FileOperations, ReadFileResult } from '../types/fileSystem';
import { normalizePath, getFileName, getDirPath } from './path';
import { buildUserScopedPath } from './userScopedStorage';
export { batchConcurrent } from './batchConcurrent';

/**
 * Server-side TextFile structure
 * Base data structure for all file operations
 *
 * - path:    folder path where the file resides (e.g. "posts"), root is ""
 * - name:    file name (e.g. "tweet_123.json")
 * - content: file content
 */
interface TextFile {
  path?: string;
  name?: string;
  content?: string;
}

/**
 * Raw entry format returned by cloud listFiles
 *
 * - path: entry name (relative to the requested directory), e.g. "posts", "state.json"
 * - type: 0 = file, 1 = directory
 * - size: file size (only present for file type)
 */
interface CloudFileEntry {
  path: string;
  type: number;
  size?: number;
}

/**
 * Response format for cloud listFiles
 */
interface CloudListResponse {
  files: CloudFileEntry[];
  not_exists: boolean;
}

/**
 * Converts an internal full path to TextFile's path (directory) and name (filename)
 *
 * Examples:
 *   "/posts/tweet_123.json" → { path: "posts", name: "tweet_123.json" }
 *   "/a/b/c/file.txt"      → { path: "a/b/c", name: "file.txt" }
 *   "/state.json"           → { path: "", name: "state.json" }
 */
const toTextFile = (fullPath: string, content?: string): TextFile => {
  const normalized = normalizePath(fullPath);
  return {
    path: getDirPath(normalized),
    name: getFileName(normalized),
    ...(content !== undefined ? { content } : {}),
  };
};

/** Format timestamp as HH:mm:ss.SSS */
const ts = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}.${String(d.getMilliseconds()).padStart(3, '0')}`;
};

// ============ File Operation Implementation (based on @gui/vibe-container file interface) ============

/**
 * List files (single level)
 * Communicates with the server using manager.listFiles()
 * Passes the TextFile path field (directory path)
 *
 * Cloud response format is { files: [{ path, type, size? }], not_exists }
 *   - type: 0 = file, 1 = directory
 *   - path: entry name relative to the requested directory
 *
 * This function converts the response to FileNode[] format
 */
export const listFiles = async (path = '/'): Promise<FileNode[]> => {
  const manager = getClientComManager();
  const normalizedPath = normalizePath(path);
  // listFiles only needs path (directory path without leading slash)
  const dirPath = path === '/' ? '' : normalizedPath.replace(/^\//, '');
  const startTime = ts();
  const t0 = performance.now();
  const result = await manager.listFiles<CloudListResponse>({ path: dirPath });
  console.info(
    `[FileApi][${startTime}] listFiles "${dirPath || '/'}" — ${(performance.now() - t0).toFixed(1)}ms`,
  );

  if (!result || result.not_exists || !result.files) {
    return [];
  }

  return result.files.map((entry) => {
    // entry.path may be a full path or relative name; extract the entry name relative to the current directory
    let entryName = entry.path;
    if (dirPath && entryName.startsWith(`${dirPath}/`)) {
      entryName = entryName.slice(dirPath.length + 1);
    }

    // Build full path: parent directory + entry name
    const fullPath = normalizePath(dirPath ? `/${dirPath}/${entryName}` : `/${entryName}`);
    const isFolder = entry.type === 1;

    return {
      id: '',
      name: entryName,
      path: fullPath,
      type: isFolder ? 'folder' : 'file',
      parentId: null,
      children: isFolder ? [] : undefined,
      metadata: entry.size !== undefined ? { size: entry.size } : undefined,
    } as FileNode;
  });
};

/**
 * Read file content
 * Communicates with the server using manager.getFile()
 * Passes file_path (full path including filename, without leading slash)
 *
 * The server may return two formats:
 *   1. ReadFileResult structure: { content: "...", metadata: {...} }
 *   2. The file content itself (string or parsed object)
 * This function wraps the result uniformly as ReadFileResult
 */
export const readFile = async (path: string): Promise<ReadFileResult> => {
  const manager = getClientComManager();
  const normalized = normalizePath(path);
  // file_path without leading slash, e.g. "posts/tweet_123.json"
  const filePath = normalized.replace(/^\//, '');
  const startTime = ts();
  const t0 = performance.now();
  const result = await manager.getFile<unknown>({ file_path: filePath });
  console.info(
    `[FileApi][${startTime}] readFile "${filePath}" — ${(performance.now() - t0).toFixed(1)}ms`,
  );

  if (result === null || result === undefined) {
    return { content: undefined, metadata: {} };
  }

  // Check if the return value is a ReadFileResult structure (has both content and metadata fields, and metadata is an object)
  if (
    typeof result === 'object' &&
    !Array.isArray(result) &&
    'content' in result &&
    'metadata' in result &&
    typeof (result as Record<string, unknown>).metadata === 'object'
  ) {
    return result as ReadFileResult;
  }

  // Server returned file content directly; wrap as ReadFileResult
  return { content: result, metadata: {} };
};

/**
 * Write file
 * Communicates with the server using manager.putTextFilesByJSON()
 * TextFile: path (directory) / name (filename) / content
 */
export const writeFile = async (path: string, content: unknown): Promise<void> => {
  const manager = getClientComManager();
  const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
  const file = toTextFile(path, contentStr);
  const startTime = ts();
  const t0 = performance.now();
  await manager.putTextFilesByJSON({ files: [file] });
  console.info(
    `[FileApi][${startTime}] writeFile "${file.path}/${file.name}" — ${(performance.now() - t0).toFixed(1)}ms`,
  );
};

/**
 * Delete file
 * Communicates with the server using manager.deleteFilesByPaths()
 * Passes file_paths (array of full paths without leading slash)
 */
export const deleteFile = async (path: string): Promise<void> => {
  const manager = getClientComManager();
  const normalized = normalizePath(path);
  const filePath = normalized.replace(/^\//, '');
  const startTime = ts();
  const t0 = performance.now();
  await manager.deleteFilesByPaths({ file_paths: [filePath] });
  console.info(
    `[FileApi][${startTime}] deleteFile "${filePath}" — ${(performance.now() - t0).toFixed(1)}ms`,
  );
};

/**
 * Batch delete files
 * Communicates with the server using manager.deleteFilesByPaths()
 * Passes file_paths (array of full paths without leading slash)
 */
export const deleteFiles = async (paths: string[]): Promise<void> => {
  const manager = getClientComManager();
  const filePaths = paths.map((p) => normalizePath(p).replace(/^\//, ''));
  const startTime = ts();
  const t0 = performance.now();
  await manager.deleteFilesByPaths({ file_paths: filePaths });
  console.info(
    `[FileApi][${startTime}] deleteFiles [${filePaths.length}] — ${(performance.now() - t0).toFixed(1)}ms`,
  );
};

/**
 * Search files
 * Communicates with the server using manager.searchFiles()
 */
export const searchFiles = async (query: string): Promise<FileNode[]> => {
  const manager = getClientComManager();
  const startTime = ts();
  const t0 = performance.now();
  const result = await manager.searchFiles<FileNode[]>({ query });
  console.info(
    `[FileApi][${startTime}] searchFiles "${query}" — ${(performance.now() - t0).toFixed(1)}ms`,
  );
  return result ?? [];
};

/**
 * Batch write text files
 * Uses manager.putTextFilesByJSON() for batch operations
 * Each file object strictly follows the TextFile structure: path (directory) / name (filename) / content
 */
export const putTextFiles = async (
  files: Array<{ path: string; content: string | unknown }>,
): Promise<void> => {
  const manager = getClientComManager();
  const textFiles: TextFile[] = files.map((f) => {
    const contentStr = typeof f.content === 'string' ? f.content : JSON.stringify(f.content);
    return toTextFile(f.path, contentStr);
  });
  const startTime = ts();
  const t0 = performance.now();
  await manager.putTextFilesByJSON({ files: textFiles });
  console.info(
    `[FileApi][${startTime}] putTextFiles [${textFiles.length}] — ${(performance.now() - t0).toFixed(1)}ms`,
  );
};

// ============ App Path-Prefixed File API Factory ============

/**
 * Create a file API with App path prefix
 *
 * All cloud paths are automatically prefixed with `apps/{appName}/data`,
 * and returned FileNode paths remain in internal format (without prefix).
 *
 * Examples:
 *   const api = createAppFileApi('twitter');
 *   api.listFiles('/')          → cloud request path: "apps/twitter/data"
 *   api.readFile('/posts/1.json') → cloud request { file_path: "apps/twitter/data/posts/1.json" }
 *   api.writeFile('/state.json', data) → cloud request { path: "apps/twitter/data", name: "state.json" }
 *
 * @param appName Application identifier (e.g. 'twitter'), used to build the cloud path prefix
 */
export function createAppFileApi(appName: string): FileOperations {
  const getScopedBasePath = (): string => buildUserScopedPath(`apps/${appName}/data`);
  const getLegacyBasePath = (): string => `apps/${appName}/data`;

  /**
   * Convert internal path to cloud path
   *   "/" → "/apps/twitter/data"
   *   "/posts/tweet.json" → "/apps/twitter/data/posts/tweet.json"
   */
  const toCloudPath = (internalPath: string, scoped = true): string => {
    const basePath = scoped ? getScopedBasePath() : getLegacyBasePath();
    const normalized = normalizePath(internalPath);
    return normalized === '/' ? `/${basePath}` : `/${basePath}${normalized}`;
  };

  return {
    /**
     * List files (single level)
     * Cloud path is prefixed; returned FileNode.path remains in internal format
     */
    listFiles: async (path = '/'): Promise<FileNode[]> => {
      const manager = getClientComManager();
      const normalizedPath = normalizePath(path);

      // Internal directory path (without prefix), used to build returned FileNode.path
      const internalDirPath = path === '/' ? '' : normalizedPath.replace(/^\//, '');
      // Cloud directory path (with prefix), used for API requests
      const scopedBasePath = getScopedBasePath();
      const legacyBasePath = getLegacyBasePath();
      const cloudDirPath = internalDirPath ? `${scopedBasePath}/${internalDirPath}` : scopedBasePath;
      const legacyCloudDirPath = internalDirPath ? `${legacyBasePath}/${internalDirPath}` : legacyBasePath;

      const startTime = ts();
      const t0 = performance.now();
      let result = await manager.listFiles<CloudListResponse>({ path: cloudDirPath });
      if (!result || result.not_exists || !result.files || result.files.length === 0) {
        result = await manager.listFiles<CloudListResponse>({ path: legacyCloudDirPath });
      }
      console.info(
        `[FileApi:${appName}][${startTime}] listFiles "${path}" — ${(performance.now() - t0).toFixed(1)}ms`,
      );

      if (!result || result.not_exists || !result.files) {
        return [];
      }

      return result.files.map((entry) => {
        // entry.path may be a full cloud path (e.g. "apps/twitter/data/posts"),
        // a session-prefixed path (e.g. "charId/modId/apps/twitter/data/posts"),
        // or a relative name (e.g. "posts"). Extract the entry name relative to the current directory.
        let entryName = entry.path;
        const cloudDirSuffix = `${cloudDirPath}/`;
        const legacyCloudDirSuffix = `${legacyCloudDirPath}/`;
        const suffixIndex = entryName.indexOf(cloudDirSuffix);
        if (suffixIndex !== -1) {
          entryName = entryName.slice(suffixIndex + cloudDirSuffix.length);
        } else {
          const legacySuffixIndex = entryName.indexOf(legacyCloudDirSuffix);
          if (legacySuffixIndex !== -1) {
            entryName = entryName.slice(legacySuffixIndex + legacyCloudDirSuffix.length);
          }
        }

        // Build FileNode.path using internal path (without prefix)
        const fullPath = normalizePath(
          internalDirPath ? `/${internalDirPath}/${entryName}` : `/${entryName}`,
        );
        const isFolder = entry.type === 1;

        return {
          id: '',
          name: entryName,
          path: fullPath,
          type: isFolder ? 'folder' : 'file',
          parentId: null,
          children: isFolder ? [] : undefined,
          metadata: entry.size !== undefined ? { size: entry.size } : undefined,
        } as FileNode;
      });
    },

    readFile: async (path: string) => {
      const scopedResult = await readFile(toCloudPath(path, true));
      if (scopedResult.content !== undefined) {
        return scopedResult;
      }
      return readFile(toCloudPath(path, false));
    },

    writeFile: (path: string, content: unknown) => writeFile(toCloudPath(path, true), content),

    deleteFile: (path: string) => deleteFile(toCloudPath(path, true)),
  };
}

// ============ Export File Operations Interface Object ============

/**
 * File operations interface instance (connects to real cloud, no path prefix)
 * Generally not used directly; use createAppFileApi(appName) to create a prefixed instance
 */
export const fileApi: FileOperations = {
  listFiles,
  readFile,
  writeFile,
  deleteFile,
};

export default fileApi;
