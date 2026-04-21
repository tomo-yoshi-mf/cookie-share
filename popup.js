const copyButton = document.getElementById("copy");
const statusEl = document.getElementById("status");

copyButton.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) {
    showStatus("Cannot read current tab URL.", "error");
    return;
  }

  copyButton.disabled = true;
  copyButton.textContent = "Copying…";

  try {
    const response = await chrome.runtime.sendMessage({
      type: "COPY_COOKIES",
      sourceUrl: tab.url,
    });
    showStatus(response.message, response.success ? "success" : "error");
  } catch (err) {
    showStatus(`Error: ${err.message}`, "error");
  } finally {
    copyButton.disabled = false;
    copyButton.textContent = "Copy Cookies to localhost";
  }
});

function showStatus(message, type = "success") {
  statusEl.textContent = message;
  statusEl.className = type === "error" ? "error" : "";

  setTimeout(() => {
    statusEl.textContent = "";
    statusEl.className = "";
  }, 3000);
}
