/**
 * ApplyDesk Capture Background Service Worker
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log("ApplyDesk Capture Extension Installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "PING") {
    sendResponse({ status: "ok" });
  }
  return true;
});
