// This log appears in the SERVICE WORKER console:
// chrome://extensions → Cookie Share → "Service Worker" link → Console tab
console.log('[CookieShare] background.js loaded');

const DEFAULT_PORT = 3000;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[CookieShare] onMessage received in background:', message.type, 'from tab:', sender.tab?.id);

  if (message.type === "COPY_COOKIES") {
    // sender.tab is present when called from a content script,
    // undefined when called from the popup.
    handleCopyCookies(message.sourceUrl, sender.tab?.id, sendResponse);
    return true; // keep message channel open for async sendResponse
  }
});

async function handleCopyCookies(sourceUrl, tabId, sendResponse) {
  try {
    const { localhostPort = DEFAULT_PORT } = await chrome.storage.sync.get("localhostPort");
    const targetUrl = `http://localhost:${localhostPort}`;

    // Use origin only (no path/query) to get all domain cookies
    const origin = new URL(sourceUrl).origin;
    console.log(`[CookieShare] Getting cookies for origin: ${origin}`);

    const cookies = await chrome.cookies.getAll({ url: origin });
    console.log(`[CookieShare] Found ${cookies.length} cookie(s):`, cookies.map(c => c.name));

    if (cookies.length === 0) {
      const result = { success: false, message: 'No cookies found on this page.' };
      sendResponse(result);
      sendToTab(tabId, result);
      return;
    }

    const results = await Promise.allSettled(
      cookies.map((cookie) => setCookieOnLocalhost(cookie, targetUrl))
    );

    results.forEach((r, i) => {
      if (r.status === "fulfilled") {
        console.log(`[CookieShare] ✓ Set cookie: ${cookies[i].name}`);
      } else {
        console.warn(`[CookieShare] ✗ Failed cookie: ${cookies[i].name} — ${r.reason?.message}`);
      }
    });

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    const result = {
      success: succeeded > 0,
      message: `Copied ${succeeded} cookie(s) to localhost:${localhostPort}.${failed > 0 ? ` (${failed} failed)` : ""}`,
    };

    sendResponse(result);
    if (tabId != null) sendToTab(tabId, result);
  } catch (error) {
    console.error('[CookieShare] handleCopyCookies error:', error);
    const result = { success: false, message: `Error: ${error.message}` };
    sendResponse(result);
    if (tabId != null) sendToTab(tabId, result);
  }
}

function sendToTab(tabId, result) {
  chrome.tabs.sendMessage(tabId, { type: "COPY_RESULT", ...result }).catch((err) => {
    console.warn('[CookieShare] tabs.sendMessage failed (ok if sendResponse already delivered):', err.message);
  });
}

async function setCookieOnLocalhost(cookie, targetUrl) {
  // Copy name and value only — avoid domain/secure/sameSite/httpOnly
  // attribute conflicts that cause chrome.cookies.set to return null on localhost.
  const details = {
    url: targetUrl,
    name: cookie.name,
    value: cookie.value,
    path: "/",
  };

  console.log(`[CookieShare] Setting cookie: ${cookie.name}`);
  const result = await chrome.cookies.set(details);
  if (result === null) {
    throw new Error(`chrome.cookies.set returned null for "${cookie.name}"`);
  }
  return result;
}
