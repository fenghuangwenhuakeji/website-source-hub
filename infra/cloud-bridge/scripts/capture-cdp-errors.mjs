const DEFAULT_ENDPOINT = "http://127.0.0.1:9223";
const DEFAULT_URL = "http://127.0.0.1:5182/home";
const WAIT_MS = Number(process.env.CDP_WAIT_MS ?? 6000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJson(endpoint, path) {
  const response = await fetch(`${endpoint}${path}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${path}`);
  }

  return response.json();
}

async function attachSocket(url) {
  const socket = new WebSocket(url);

  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  return socket;
}

async function main() {
  const endpoint = process.argv[2] ?? DEFAULT_ENDPOINT;
  const targetUrl = process.argv[3] ?? DEFAULT_URL;

  const browserInfo = await getJson(endpoint, "/json/version");
  const browserSocket = await attachSocket(browserInfo.webSocketDebuggerUrl);

  let browserMessageId = 0;
  const waiters = new Map();

  browserSocket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    const resolver = waiters.get(message.id);
    if (resolver) {
      waiters.delete(message.id);
      resolver(message);
    }
  });

  const sendToBrowser = (method, params = {}) =>
    new Promise((resolve) => {
      const id = ++browserMessageId;
      waiters.set(id, resolve);
      browserSocket.send(JSON.stringify({ id, method, params }));
    });

  const createTarget = await sendToBrowser("Target.createTarget", { url: targetUrl });
  const targetId = createTarget.result.targetId;
  browserSocket.close();

  await sleep(1000);

  const pages = await getJson(endpoint, "/json/list");
  const page = pages.find((item) => item.id === targetId) ?? pages.find((item) => item.url === targetUrl);
  if (!page?.webSocketDebuggerUrl) {
    throw new Error(`Unable to find target for ${targetUrl}`);
  }

  const pageSocket = await attachSocket(page.webSocketDebuggerUrl);
  let pageMessageId = 0;
  const pageWaiters = new Map();
  const events = [];

  pageSocket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    const resolver = pageWaiters.get(message.id);
    if (resolver) {
      pageWaiters.delete(message.id);
      resolver(message);
      return;
    }

    events.push(message);
  });

  const sendToPage = (method, params = {}) =>
    new Promise((resolve) => {
      const id = ++pageMessageId;
      pageWaiters.set(id, resolve);
      pageSocket.send(JSON.stringify({ id, method, params }));
    });

  await sendToPage("Page.enable");
  await sendToPage("Runtime.enable");
  await sendToPage("Log.enable");
  await sendToPage("Page.reload", { ignoreCache: true });

  await sleep(WAIT_MS);

  const interesting = events.filter((message) =>
    [
      "Runtime.exceptionThrown",
      "Runtime.consoleAPICalled",
      "Log.entryAdded",
      "Page.javascriptDialogOpening",
    ].includes(message.method)
  );

  console.log(JSON.stringify(interesting, null, 2));
  pageSocket.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
