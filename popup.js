const DEFAULT_PORT = 3000;

const portInput = document.getElementById("port");
const saveButton = document.getElementById("save");
const copyButton = document.getElementById("copy");
const statusEl = document.getElementById("status");

// Load saved port on open
chrome.storage.sync.get("localhostPort", ({ localhostPort }) => {
  portInput.value = localhostPort ?? DEFAULT_PORT;
});

saveButton.addEventListener("click", () => {
  const raw = portInput.value.trim();
  const port = parseInt(raw, 10);

  if (!raw || isNaN(port) || port < 1 || port > 65535) {
    showStatus("Enter a valid port (1–65535).", "error");
    return;
  }

  chrome.storage.sync.set({ localhostPort: port }, () => {
    showStatus(`Saved — localhost:${port}`);
  });
});

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
