import { getSettings, saveSettings } from "../lib/storage.js";
import { pingConnection } from "../lib/api-client.js";

document.addEventListener("DOMContentLoaded", async () => {
  const baseUrlInput = document.getElementById("base-url");
  const apiTokenInput = document.getElementById("api-token");
  const toggleTokenBtn = document.getElementById("toggle-token-btn");
  const banner = document.getElementById("status-banner");
  const optionsForm = document.getElementById("options-form");
  const testBtn = document.getElementById("test-btn");
  const saveBtn = document.getElementById("save-btn");

  // Load existing settings
  const settings = await getSettings();
  baseUrlInput.value = settings.baseUrl;
  apiTokenInput.value = settings.token;

  // Toggle password visibility
  toggleTokenBtn.addEventListener("click", () => {
    if (apiTokenInput.type === "password") {
      apiTokenInput.type = "text";
      toggleTokenBtn.textContent = "Hide";
    } else {
      apiTokenInput.type = "password";
      toggleTokenBtn.textContent = "Show";
    }
  });

  // Save Settings
  optionsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showBanner("Saving settings...", "normal");
    try {
      await saveSettings(baseUrlInput.value, apiTokenInput.value);
      showBanner("✅ Settings saved successfully to chrome.storage.local!", "success");
    } catch (err) {
      showBanner(`❌ Failed to save: ${err.message}`, "error");
    }
  });

  // Test Connection
  testBtn.addEventListener("click", async () => {
    const url = baseUrlInput.value.trim();
    const token = apiTokenInput.value.trim();

    if (!token) {
      showBanner("⚠️ Please enter your Personal Access Token first.", "error");
      return;
    }

    showBanner("Connecting to ApplyDesk backend...", "normal");
    testBtn.disabled = true;

    try {
      await pingConnection(url, token);
      showBanner("✅ Connection successful! ApplyDesk backend & Personal Token verified.", "success");
    } catch (err) {
      showBanner(`❌ Connection test failed: ${err.message}`, "error");
    } finally {
      testBtn.disabled = false;
    }
  });

  function showBanner(message, type) {
    banner.textContent = message;
    banner.className = "banner";
    if (type === "success") {
      banner.classList.add("success");
    } else if (type === "error") {
      banner.classList.add("error");
    } else {
      banner.style.display = "block";
      banner.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
      banner.style.color = "var(--ink)";
    }
  }
});
