document.getElementById("capture-btn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) return;

  chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
    if (dataUrl) {
      // Store screenshot in chrome storage
      chrome.storage.local.set({ capturedJobScreenshot: dataUrl }, () => {
        // Open ApplyDesk applications page
        chrome.tabs.create({ url: "http://localhost:3000/applications" });
      });
    }
  });
});
