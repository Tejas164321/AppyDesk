# ApplyDesk Capture — Chrome Extension (Manifest V3)

**ApplyDesk Capture** is a Manifest V3 browser extension that lets you capture job posting screenshots on LinkedIn (or any job site), generate AI-tailored application emails, review/edit them right inside the extension popup, and send them directly through your Gmail account — without leaving the page!

---

## 🛠️ Features

* **📸 Multi-Screenshot Capture:** Capture viewport screenshots as you scroll down long job postings (`chrome.tabs.captureVisibleTab`).
* **✨ AI Extraction & Drafting:** Sends screenshots & text to ApplyDesk `/api/extract` using your Personal API Token.
* **✍️ In-Popup Review & Editing:** Edit Company, Role, Contact Email, Match Score, Subject Line, and Email Body right inside the popup.
* **🚀 Direct Outbound Send:** Sends via `/api/send` with resume PDF automatically attached via Cloudinary.
* **📊 Automatic Tracking:** Applications sent via extension are tagged with `source: "extension"` and logged directly in your ApplyDesk Application Tracker.
* **🔒 Secure Personal Token Auth:** Uses `chrome.storage.local` with scoped Personal API tokens.

---

## 📦 How to Load in Chrome

1. Open **Google Chrome** and navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the `pro/extension` directory from your project workspace:
   ```text
   c:\Users\tejas\OneDrive\Desktop\test 1\pro\extension
   ```

---

## ⚙️ Initial Setup (First Time Only)

1. Open your ApplyDesk dashboard at `http://localhost:3000/profile`.
2. Scroll to **Developer & Extension Access Token** and click **Generate Extension Token**.
3. Copy the generated `adk_live_...` API Token.
4. Click the ApplyDesk Extension icon in Chrome, or right-click it and select **Options**.
5. Set:
   * **ApplyDesk Base URL:** `http://localhost:3000`
   * **Personal Access Token:** Paste your `adk_live_...` token.
6. Click **Test Connection** (verify green checkmark), then click **Save Settings**.

---

## 🎯 How to Use

1. Browse to any job post (LinkedIn, Indeed, company careers page).
2. Click the **ApplyDesk Capture** extension icon.
3. Click **📸 Capture Page Screenshot** (scroll down and click again if it's a long posting).
4. Click **✨ Draft Application**.
5. Review & edit the AI-generated email draft, subject line, and recipient email.
6. Click **🚀 Send Application Email**.
7. Your email is sent via Gmail with your resume attached, and recorded in your ApplyDesk Application Tracker!
