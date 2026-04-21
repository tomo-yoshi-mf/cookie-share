const TARGET_URL = "http://localhost";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "COPY_COOKIES") {
    handleCopyCookies(message.sourceUrl, sender.tab?.id, sendResponse);
    return true; // keep message channel open for async sendResponse
  }
});

async function handleCopyCookies(sourceUrl, tabId, sendResponse) {
  try {
    const origin = new URL(sourceUrl).origin;
    const cookies = await chrome.cookies.getAll({ url: origin });

    if (cookies.length === 0) {
      const result = { success: false, message: "No cookies found on this page." };
      sendResponse(result);
      if (tabId != null) sendToTab(tabId, result);
      return;
    }

    const results = await Promise.allSettled(
      cookies.map((cookie) => setCookieOnLocalhost(cookie))
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    const result = {
      success: succeeded > 0,
      message: `Copied ${succeeded} cookie(s) to localhost.${failed > 0 ? ` (${failed} failed)` : ""}`,
    };

    sendResponse(result);
    if (tabId != null) sendToTab(tabId, result);
  } catch (error) {
    const result = { success: false, message: `Error: ${error.message}` };
    sendResponse(result);
    if (tabId != null) sendToTab(tabId, result);
  }
}

function sendToTab(tabId, result) {
  chrome.tabs.sendMessage(tabId, { type: "COPY_RESULT", ...result }).catch(() => {});
}

async function setCookieOnLocalhost(cookie) {
  const details = {
    url: TARGET_URL,
    name: cookie.name,
    value: cookie.value,
    path: "/",
  };

  const result = await chrome.cookies.set(details);
  if (result === null) {
    throw new Error(`Failed to set cookie "${cookie.name}"`);
  }
  return result;
}
