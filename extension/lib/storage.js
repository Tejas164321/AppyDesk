/**
 * ApplyDesk Extension Storage Helper
 * Wraps chrome.storage.local (never uses localStorage)
 */

const DEFAULT_BASE_URL = "http://localhost:3000";

export function getSettings() {
  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["apiBaseUrl", "apiToken"], (items) => {
        resolve({
          baseUrl: (items.apiBaseUrl || DEFAULT_BASE_URL).replace(/\/$/, ""),
          token: items.apiToken || "",
        });
      });
    } else {
      resolve({ baseUrl: DEFAULT_BASE_URL, token: "" });
    }
  });
}

export function saveSettings(baseUrl, token) {
  return new Promise((resolve, reject) => {
    const cleanUrl = (baseUrl || DEFAULT_BASE_URL).trim().replace(/\/$/, "");
    const cleanToken = (token || "").trim();

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(
        {
          apiBaseUrl: cleanUrl,
          apiToken: cleanToken,
        },
        () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve({ baseUrl: cleanUrl, token: cleanToken });
          }
        }
      );
    } else {
      resolve({ baseUrl: cleanUrl, token: cleanToken });
    }
  });
}
