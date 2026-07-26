import { getSettings } from "../lib/storage.js";
import { extractJobDetails, sendApplicationEmail } from "../lib/api-client.js";

document.addEventListener("DOMContentLoaded", async () => {
  // State Variables
  let baseUrl = "http://localhost:3000";
  let token = "";
  let screenshots = [];
  let currentExtraction = null;

  // DOM Elements
  const tokenStatusPill = document.getElementById("token-status");
  const optionsBtn = document.getElementById("options-btn");
  const banner = document.getElementById("popup-banner");

  const captureStep = document.getElementById("capture-step");
  const autofillBtn = document.getElementById("autofill-btn");
  const captureBtn = document.getElementById("capture-btn");
  const thumbnailsContainer = document.getElementById("thumbnails-container");
  const jdTextarea = document.getElementById("jd-text");
  const draftBtn = document.getElementById("draft-btn");

  const loadingStep = document.getElementById("loading-step");
  const loadingMsg = document.getElementById("loading-msg");

  const reviewStep = document.getElementById("review-step");
  const matchScoreBadge = document.getElementById("match-score-badge");
  const reCaptureBtn = document.getElementById("re-capture-btn");
  const companyInput = document.getElementById("company-input");
  const roleInput = document.getElementById("role-input");
  const emailInput = document.getElementById("email-input");
  const subjectInput = document.getElementById("subject-input");
  const bodyInput = document.getElementById("body-input");
  const sendBtn = document.getElementById("send-btn");

  const successStep = document.getElementById("success-step");
  const successDesc = document.getElementById("success-desc");
  const dashboardBtn = document.getElementById("dashboard-btn");
  const newCaptureBtn = document.getElementById("new-capture-btn");
  const openHistoryLink = document.getElementById("open-history-link");

  // Load Settings
  const settings = await getSettings();
  baseUrl = settings.baseUrl;
  token = settings.token;

  if (token) {
    tokenStatusPill.textContent = "Token Set";
    tokenStatusPill.className = "token-pill";
  } else {
    tokenStatusPill.textContent = "No Token";
    tokenStatusPill.className = "token-pill missing";
    showBanner("⚠️ Click ⚙️ to set your Personal Access Token before drafting.", "error");
  }

  // Open Options Page
  optionsBtn.addEventListener("click", () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL("options/options.html"));
    }
  });

  // Open Dashboard Links
  const openDashboard = () => {
    const targetUrl = `${baseUrl.replace(/\/$/, "")}/tracker`;
    chrome.tabs.create({ url: targetUrl });
  };
  dashboardBtn.addEventListener("click", openDashboard);
  openHistoryLink.addEventListener("click", (e) => {
    e.preventDefault();
    openDashboard();
  });

  // 1. TRIGGER AUTOFILL FORM ON CURRENT TAB
  if (autofillBtn) {
    autofillBtn.addEventListener("click", () => {
      if (!token) {
        showBanner("⚠️ Please configure your Personal Access Token in Options (⚙️).", "error");
        return;
      }

      if (typeof chrome === "undefined" || !chrome.tabs || !chrome.tabs.query) {
        showBanner("Autofill requires Chrome extension environment.", "error");
        return;
      }

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) return;
        const activeTab = tabs[0];

        chrome.tabs.sendMessage(activeTab.id, { type: "TRIGGER_AUTOFILL" }, (response) => {
          if (chrome.runtime.lastError) {
            showBanner("Could not trigger autofill on this page. Make sure you are on a web page with an active application form.", "error");
          } else {
            showBanner("⚡ Triggered Autofill on current page!", "success");
            setTimeout(() => window.close(), 1000);
          }
        });
      });
    });
  }

  // Update Draft Button state
  const updateDraftButtonState = () => {
    const hasInput = screenshots.length > 0 || jdTextarea.value.trim().length > 0;
    draftBtn.disabled = !hasInput || !token;
  };
  jdTextarea.addEventListener("input", updateDraftButtonState);

  // 2. Capture Visible Tab Screenshot
  captureBtn.addEventListener("click", () => {
    if (typeof chrome === "undefined" || !chrome.tabs || !chrome.tabs.captureVisibleTab) {
      showBanner("Screenshot capture requires Chrome extension environment.", "error");
      return;
    }

    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        showBanner(`Screenshot failed: ${chrome.runtime.lastError?.message || "Unknown error"}`, "error");
        return;
      }

      screenshots.push(dataUrl);
      renderThumbnails();
      updateDraftButtonState();
      hideBanner();
    });
  });

  // Render Thumbnails Strip
  function renderThumbnails() {
    thumbnailsContainer.innerHTML = "";
    if (screenshots.length === 0) {
      thumbnailsContainer.classList.add("hidden");
      return;
    }

    thumbnailsContainer.classList.remove("hidden");
    screenshots.forEach((imgUrl, index) => {
      const card = document.createElement("div");
      card.className = "thumbnail-card";

      const img = document.createElement("img");
      img.src = imgUrl;
      img.className = "thumbnail-img";

      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-thumb-btn";
      removeBtn.innerHTML = "×";
      removeBtn.title = "Remove screenshot";
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        screenshots.splice(index, 1);
        renderThumbnails();
        updateDraftButtonState();
      });

      card.appendChild(img);
      card.appendChild(removeBtn);
      thumbnailsContainer.appendChild(card);
    });
  }

  // 3. Process / Draft Application
  draftBtn.addEventListener("click", async () => {
    if (!token) {
      showBanner("⚠️ Please configure your Personal Access Token in Options (⚙️).", "error");
      return;
    }

    hideBanner();
    showStep("loading");
    loadingMsg.textContent = "AI Analyzing screenshots & drafting application...";

    try {
      const text = jdTextarea.value.trim();
      const result = await extractJobDetails(baseUrl, token, { text, images: screenshots });

      currentExtraction = result;
      companyInput.value = result.company || "";
      roleInput.value = result.role || "";
      emailInput.value = result.contactEmail || "";
      subjectInput.value = result.subject || "";
      bodyInput.value = result.body || "";

      const score = result.matchScore || 80;
      matchScoreBadge.textContent = `${score}% Match`;
      if (score >= 75) {
        matchScoreBadge.style.color = "var(--green)";
        matchScoreBadge.style.borderColor = "rgba(16, 185, 129, 0.3)";
      } else {
        matchScoreBadge.style.color = "var(--amber)";
        matchScoreBadge.style.borderColor = "rgba(245, 158, 11, 0.3)";
      }

      showStep("review");
    } catch (err) {
      showStep("capture");
      showBanner(`AI Extraction error: ${err.message}`, "error");
    }
  });

  // Re-capture / Back button
  reCaptureBtn.addEventListener("click", () => {
    showStep("capture");
  });

  // 4. Review & Send Application Email
  sendBtn.addEventListener("click", async () => {
    const contactEmail = emailInput.value.trim();
    const subject = subjectInput.value.trim();
    const body = bodyInput.value.trim();

    if (!contactEmail || !subject || !body) {
      showBanner("Recipient Email, Subject line, and Body text are required.", "error");
      return;
    }

    sendBtn.disabled = true;
    sendBtn.innerHTML = "<span>Outbound Sending...</span>";
    hideBanner();

    try {
      const payload = {
        company: companyInput.value.trim() || "Company",
        role: roleInput.value.trim() || "Position",
        contactEmail,
        subject,
        body,
        matchScore: currentExtraction?.matchScore || 80,
        keyRequirements: currentExtraction?.keyRequirements || [],
        source: "extension",
      };

      const res = await sendApplicationEmail(baseUrl, token, payload);

      successDesc.innerHTML = `Your tailored email to <strong>${contactEmail}</strong> for <strong>${payload.role}</strong> at <strong>${payload.company}</strong> has been sent via Gmail API with resume attached.`;
      showStep("success");
    } catch (err) {
      showBanner(`Send failed: ${err.message}`, "error");
    } finally {
      sendBtn.disabled = false;
      sendBtn.innerHTML = "<span>🚀 Send Application Email</span>";
    }
  });

  // Capture Another Job Reset
  newCaptureBtn.addEventListener("click", () => {
    screenshots = [];
    currentExtraction = null;
    jdTextarea.value = "";
    renderThumbnails();
    updateDraftButtonState();
    showStep("capture");
    hideBanner();
  });

  // Helper Functions
  function showStep(stepName) {
    captureStep.classList.add("hidden");
    loadingStep.classList.add("hidden");
    reviewStep.classList.add("hidden");
    successStep.classList.add("hidden");

    if (stepName === "capture") captureStep.classList.remove("hidden");
    if (stepName === "loading") loadingStep.classList.remove("hidden");
    if (stepName === "review") reviewStep.classList.remove("hidden");
    if (stepName === "success") successStep.classList.remove("hidden");
  }

  function showBanner(msg, type) {
    banner.textContent = msg;
    banner.className = `banner ${type}`;
    banner.classList.remove("hidden");
  }

  function hideBanner() {
    banner.classList.add("hidden");
  }
});
