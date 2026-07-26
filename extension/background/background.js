/**
 * ApplyDesk Capture Background Service Worker
 * Handles extension installation, message proxying, and background resume binary fetching.
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log("ApplyDesk Capture Extension Installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "PING") {
    sendResponse({ status: "ok" });
    return true;
  }

  // Proxy Resume File Fetching to avoid page CORS restrictions
  if (request.type === "FETCH_RESUME_BLOB") {
    const resumeUrl = request.url;
    if (!resumeUrl) {
      sendResponse({ success: false, error: "No resume URL provided" });
      return true;
    }

    fetch(resumeUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        const uint8Array = new Uint8Array(buffer);
        let binaryString = "";
        const len = uint8Array.byteLength;
        for (let i = 0; i < len; i++) {
          binaryString += String.fromCharCode(uint8Array[i]);
        }
        const base64 = btoa(binaryString);
        sendResponse({
          success: true,
          base64,
          filename: request.filename || "Resume.pdf",
          mimeType: request.mimeType || "application/pdf",
        });
      })
      .catch((err) => {
        console.error("Resume background fetch error:", err);
        sendResponse({ success: false, error: err.message });
      });

    return true; // Keep async channel open
  }

  return true;
});
