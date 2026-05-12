import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ChatHistoryData, DisplayMessage } from '../chatHistoryStorage';
import type { ChatMessage } from '../llmClient';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const SESSION_PATH = 'users/guest/char-a/mod-a';
const CHAT_API_URL = `/api/session-data?path=${encodeURIComponent(`${SESSION_PATH}/chat/chat.json`)}`;

const sampleMessages: DisplayMessage[] = [
  { id: '1', role: 'user', content: 'Hello' },
  { id: '2', role: 'assistant', content: 'Hi there!' },
];

const sampleChatHistory: ChatMessage[] = [
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'Hi there!' },
];

function makeSavedData(msgs = sampleMessages, history = sampleChatHistory): ChatHistoryData {
  return { version: 1, savedAt: Date.now(), messages: msgs, chatHistory: history };
}

describe('chatHistoryStorage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    localStorage.clear();
    vi.resetModules();
  });

  // ============ loadChatHistorySync ============

  describe('loadChatHistorySync', () => {
    it('returns null when localStorage is empty', async () => {
      const { loadChatHistorySync } = await import('../chatHistoryStorage');
      expect(loadChatHistorySync(SESSION_PATH)).toBeNull();
    });

    it('is deprecated and ignores localStorage data', async () => {
      const data = makeSavedData();
      localStorage.setItem('webuiapps-chat-history', JSON.stringify(data));
      const { loadChatHistorySync } = await import('../chatHistoryStorage');
      expect(loadChatHistorySync(SESSION_PATH)).toBeNull();
    });

    it('returns null for invalid JSON', async () => {
      localStorage.setItem('webuiapps-chat-history', 'not-json');
      const { loadChatHistorySync } = await import('../chatHistoryStorage');
      expect(loadChatHistorySync(SESSION_PATH)).toBeNull();
    });

    it('returns null for wrong version', async () => {
      localStorage.setItem(
        'webuiapps-chat-history',
        JSON.stringify({ version: 99, savedAt: 0, messages: [], chatHistory: [] }),
      );
      const { loadChatHistorySync } = await import('../chatHistoryStorage');
      expect(loadChatHistorySync(SESSION_PATH)).toBeNull();
    });
  });

  // ============ loadChatHistory (async) ============

  describe('loadChatHistory', () => {
    it('loads from session-data API', async () => {
      const data = makeSavedData();
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(data),
      });
      const { loadChatHistory } = await import('../chatHistoryStorage');

      const result = await loadChatHistory(SESSION_PATH);

      expect(fetchMock).toHaveBeenCalledWith(CHAT_API_URL, {
        headers: { 'X-Config-Scope': 'guest' },
      });
      expect(result).not.toBeNull();
      expect(result!.messages).toEqual(sampleMessages);
    });

    it('returns null when API returns non-ok', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });
      const { loadChatHistory } = await import('../chatHistoryStorage');

      const result = await loadChatHistory(SESSION_PATH);

      expect(result).toBeNull();
    });

    it('returns null when fetch throws', async () => {
      fetchMock.mockRejectedValueOnce(new Error('network error'));
      const { loadChatHistory } = await import('../chatHistoryStorage');

      const result = await loadChatHistory(SESSION_PATH);

      expect(result).toBeNull();
    });

    it('returns null when both API and localStorage are empty', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });
      const { loadChatHistory } = await import('../chatHistoryStorage');

      const result = await loadChatHistory(SESSION_PATH);
      expect(result).toBeNull();
    });
  });

  // ============ saveChatHistory ============

  describe('saveChatHistory', () => {
    it('POSTs chat history to session-data API', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true });
      const { saveChatHistory } = await import('../chatHistoryStorage');

      await saveChatHistory(SESSION_PATH, sampleMessages, sampleChatHistory);

      // Check fetch call
      expect(fetchMock).toHaveBeenCalledOnce();
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(CHAT_API_URL);
      expect(options.method).toBe('POST');
      expect(options.headers).toEqual({
        'X-Config-Scope': 'guest',
        'Content-Type': 'application/json',
      });
      const body = JSON.parse(options.body);
      expect(body.version).toBe(1);
      expect(body.messages).toEqual(sampleMessages);
      expect(body.chatHistory).toEqual(sampleChatHistory);
    });

    it('does not throw when fetch fails', async () => {
      fetchMock.mockRejectedValueOnce(new Error('network error'));
      const { saveChatHistory } = await import('../chatHistoryStorage');

      await expect(saveChatHistory(SESSION_PATH, sampleMessages, sampleChatHistory)).resolves.toBeUndefined();
    });
  });

  // ============ clearChatHistory ============

  describe('clearChatHistory', () => {
    it('sends DELETE to session-data API', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true });
      const { clearChatHistory } = await import('../chatHistoryStorage');

      await clearChatHistory(SESSION_PATH);

      expect(fetchMock).toHaveBeenCalledWith(CHAT_API_URL, {
        method: 'DELETE',
        headers: { 'X-Config-Scope': 'guest' },
      });
    });

    it('does not throw when DELETE fetch fails', async () => {
      fetchMock.mockRejectedValueOnce(new Error('network error'));
      const { clearChatHistory } = await import('../chatHistoryStorage');

      await expect(clearChatHistory(SESSION_PATH)).resolves.toBeUndefined();
    });
  });
});
