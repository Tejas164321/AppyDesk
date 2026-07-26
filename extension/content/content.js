/**
 * ApplyDesk Capture — Content Script (Self-Contained, no ES imports)
 * Phase 6c: 100% DOM-Aware LLM Autofill
 * 
 * Architecture:
 *   1. Deep DOM Extraction  — capture every field property (radio groups, checkboxes,
 *      fieldset legends, section headings, all select options, required flags, char limits)
 *   2. POST /api/autofill-map — full candidate profile + full DOM snapshot → LLM
 *   3. Precision Fill Engine — radio.click(), React nativeInputValueSetter, date splitting
 */

// ════════════════════════════════════════════════════════════════
// 1. TIER 1 ATS PATTERNS (deterministic pre-fill before LLM)
// ════════════════════════════════════════════════════════════════

const ATS_PLATFORMS = [
  {
    name: "Greenhouse",
    matchUrl: (url) => url.includes("greenhouse.io"),
    fieldRules: [
      { key: "firstName",  selectors: ["#first_name", "input[name='first_name']"] },
      { key: "lastName",   selectors: ["#last_name", "input[name='last_name']"] },
      { key: "fullName",   selectors: ["#full_name", "input[name='full_name']"] },
      { key: "email",      selectors: ["#email", "input[type='email']"] },
      { key: "phone",      selectors: ["#phone", "input[type='tel']"] },
      { key: "linkedin",   selectors: ["input[name*='linkedin']", "input[id*='linkedin']"] },
      { key: "github",     selectors: ["input[name*='github']", "input[id*='github']"] },
      { key: "portfolio",  selectors: ["input[name*='portfolio']", "input[name*='website']"] },
      { key: "resume",     selectors: ["#resume_file", "input[type='file'][name*='resume']", "input[type='file']"], isFile: true },
    ],
  },
  {
    name: "Lever",
    matchUrl: (url) => url.includes("jobs.lever.co"),
    fieldRules: [
      { key: "fullName",   selectors: ["input[name='name']"] },
      { key: "email",      selectors: ["input[name='email']"] },
      { key: "phone",      selectors: ["input[name='phone']"] },
      { key: "linkedin",   selectors: ["input[name='urls[LinkedIn]']", "input[name*='LinkedIn']"] },
      { key: "github",     selectors: ["input[name='urls[GitHub]']"] },
      { key: "portfolio",  selectors: ["input[name='urls[Portfolio]']", "input[name='urls[Other]']"] },
      { key: "resume",     selectors: ["input[type='file'][name='resume']", "input[type='file']"], isFile: true },
    ],
  },
  {
    name: "Workday",
    matchUrl: (url) => url.includes("myworkdayjobs.com") || url.includes("workday.com"),
    fieldRules: [
      { key: "firstName",  selectors: ["[data-automation-id='legalNameSection_firstName']"] },
      { key: "lastName",   selectors: ["[data-automation-id='legalNameSection_lastName']"] },
      { key: "email",      selectors: ["[data-automation-id='email']", "input[type='email']"] },
      { key: "phone",      selectors: ["[data-automation-id='phone-number']", "input[type='tel']"] },
      { key: "resume",     selectors: ["[data-automation-id='file-upload-drop-zone'] input[type='file']", "input[type='file']"], isFile: true },
    ],
  },
  {
    name: "Ashby",
    matchUrl: (url) => url.includes("ashbyhq.com"),
    fieldRules: [
      { key: "firstName",  selectors: ["input[name='_field_first_name']"] },
      { key: "lastName",   selectors: ["input[name='_field_last_name']"] },
      { key: "fullName",   selectors: ["input[name='_field_name']"] },
      { key: "email",      selectors: ["input[name='_field_email']", "input[type='email']"] },
      { key: "phone",      selectors: ["input[name='_field_phone']", "input[type='tel']"] },
      { key: "linkedin",   selectors: ["input[name*='linkedin']"] },
      { key: "github",     selectors: ["input[name*='github']"] },
      { key: "portfolio",  selectors: ["input[name*='portfolio']", "input[name*='website']"] },
      { key: "resume",     selectors: ["input[type='file']"], isFile: true },
    ],
  },
];

function matchAtsPattern(url) {
  const platform = ATS_PLATFORMS.find((p) => p.matchUrl(url));
  if (!platform) return null;

  const mappings = [];
  for (const rule of platform.fieldRules) {
    for (const sel of rule.selectors) {
      try {
        const el = document.querySelector(sel);
        if (el && isVisibleElement(el)) {
          mappings.push({ selector: sel, key: rule.key, isFile: !!rule.isFile, element: el });
          break;
        }
      } catch (_) {}
    }
  }
  return { platform: platform.name, mappings };
}

// ════════════════════════════════════════════════════════════════
// 2. DEEP DOM EXTRACTION
// ════════════════════════════════════════════════════════════════

/**
 * Collects every interactive form field from the page with rich metadata.
 * Returns an array of FieldDescriptor objects suitable for the LLM prompt.
 */
function deepExtractFormFields() {
  const fields = [];
  const seenElements = new Set();

  // ── 2a. Standard inputs / textareas / selects ──
  const standardEls = document.querySelectorAll(
    "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset'])," +
    "textarea, select"
  );

  for (const el of standardEls) {
    if (seenElements.has(el)) continue;
    if (!isVisibleElement(el) || isExcludedInput(el)) continue;
    if (el.type === "radio" || el.type === "checkbox") continue; // handled below

    seenElements.add(el);
    const descriptor = buildDescriptor(el, fields.length);
    if (descriptor) fields.push(descriptor);
  }

  // ── 2b. Radio groups ──
  const radioGroups = collectRadioGroups();
  for (const group of radioGroups) {
    if (!group.elements.some(el => isVisibleElement(el))) continue;
    fields.push({
      fieldId: `adk_radio_${fields.length}`,
      domType: "radio-group",
      type: "radio",
      name: group.name,
      label: group.groupLabel,
      sectionContext: group.sectionContext,
      radioOptions: group.options,
      required: group.required,
      elements: group.elements,
      // For serialization to server (no DOM elements)
      _hasElement: true,
    });
    for (const el of group.elements) seenElements.add(el);
  }

  // ── 2c. Checkbox groups ──
  const checkboxGroups = collectCheckboxGroups();
  for (const group of checkboxGroups) {
    if (!group.elements.some(el => isVisibleElement(el))) continue;
    fields.push({
      fieldId: `adk_checkbox_${fields.length}`,
      domType: "checkbox-group",
      type: "checkbox",
      name: group.name,
      label: group.groupLabel,
      sectionContext: group.sectionContext,
      checkboxOptions: group.options,
      required: false,
      elements: group.elements,
      _hasElement: true,
    });
    for (const el of group.elements) seenElements.add(el);
  }

  return fields;
}

function buildDescriptor(el, index) {
  const tag = el.tagName.toLowerCase();
  const type = el.type || tag;
  const fieldId = el.id ? `adk_id_${el.id}` : `adk_field_${index}`;

  // Gather all select options
  const options = [];
  if (tag === "select") {
    for (const opt of el.options) {
      if (opt.value !== "") options.push({ value: opt.value, label: opt.text.trim() });
    }
  }

  // Section context: nearest heading above this element
  const sectionContext = getNearestHeadingText(el);
  const fieldsetLegend = getFieldsetLegend(el);
  const label = getAssociatedLabelText(el);
  const maxLength = el.maxLength > 0 ? el.maxLength : el.getAttribute("data-maxlength") || null;
  const required = el.required || el.getAttribute("aria-required") === "true";
  const currentValue = el.value || "";

  return {
    fieldId,
    domType: "standard",
    type,
    tag,
    name: el.name || "",
    id: el.id || "",
    label,
    placeholder: el.placeholder || "",
    ariaLabel: el.getAttribute("aria-label") || "",
    sectionContext,
    fieldsetLegend,
    options,
    required,
    maxLength,
    currentValue,
    element: el,
    _hasElement: true,
  };
}

function collectRadioGroups() {
  const groups = {};
  const allRadios = document.querySelectorAll("input[type='radio']");

  for (const radio of allRadios) {
    if (!isVisibleElement(radio)) continue;
    const name = radio.name || radio.id || `_ungrouped_${Math.random()}`;
    if (!groups[name]) {
      groups[name] = {
        name,
        elements: [],
        options: [],
        groupLabel: "",
        sectionContext: getNearestHeadingText(radio),
        required: false,
      };
    }
    const optLabel = getAssociatedLabelText(radio) || radio.value;
    groups[name].options.push({ value: radio.value, label: optLabel });
    groups[name].elements.push(radio);
    if (radio.required) groups[name].required = true;
  }

  // Get group label from fieldset legend or nearest heading
  for (const key of Object.keys(groups)) {
    const firstEl = groups[key].elements[0];
    groups[key].groupLabel =
      getFieldsetLegend(firstEl) ||
      getNearestHeadingText(firstEl) ||
      key;
  }

  return Object.values(groups);
}

function collectCheckboxGroups() {
  const groups = {};
  const allCheckboxes = document.querySelectorAll("input[type='checkbox']");

  for (const cb of allCheckboxes) {
    if (!isVisibleElement(cb) || isExcludedInput(cb)) continue;
    const name = cb.name || `_cb_${cb.id || Math.random()}`;
    if (!groups[name]) {
      groups[name] = {
        name,
        elements: [],
        options: [],
        groupLabel: getFieldsetLegend(cb) || getNearestHeadingText(cb) || name,
        sectionContext: getNearestHeadingText(cb),
      };
    }
    groups[name].options.push({ value: cb.value, label: getAssociatedLabelText(cb) || cb.value });
    groups[name].elements.push(cb);
  }

  return Object.values(groups);
}

// ════════════════════════════════════════════════════════════════
// 3. DOM HELPER UTILITIES
// ════════════════════════════════════════════════════════════════

function isVisibleElement(el) {
  if (!el) return false;
  if (el.type === "file") return true;
  try {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== "hidden" &&
      style.display !== "none" &&
      style.opacity !== "0"
    );
  } catch (_) {
    return false;
  }
}

function isExcludedInput(el) {
  const text = [el.name, el.id, el.placeholder, el.getAttribute("aria-label") || ""]
    .join(" ").toLowerCase();
  const excludeTerms = ["search", "newsletter", "login", "password", "captcha", "cookie", "promo", "coupon"];
  return excludeTerms.some((t) => text.includes(t));
}

function getAssociatedLabelText(el) {
  // Method 1: <label for="id">
  if (el.id) {
    const label = document.querySelector(`label[for='${CSS.escape(el.id)}']`);
    if (label) return cleanText(label.innerText);
  }
  // Method 2: wrapping <label>
  const parentLabel = el.closest("label");
  if (parentLabel) return cleanText(parentLabel.innerText);
  // Method 3: aria-label
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel.trim();
  // Method 4: aria-labelledby
  const labelledById = el.getAttribute("aria-labelledby");
  if (labelledById) {
    const labelEl = document.getElementById(labelledById);
    if (labelEl) return cleanText(labelEl.innerText);
  }
  // Method 5: previous sibling label/span
  let prev = el.previousElementSibling;
  while (prev) {
    if (["LABEL", "SPAN", "DIV", "P"].includes(prev.tagName)) {
      const t = cleanText(prev.innerText);
      if (t) return t;
    }
    prev = prev.previousElementSibling;
  }
  return el.placeholder || el.name || "";
}

function getFieldsetLegend(el) {
  const fieldset = el.closest("fieldset");
  if (fieldset) {
    const legend = fieldset.querySelector("legend");
    if (legend) return cleanText(legend.innerText);
  }
  return "";
}

function getNearestHeadingText(el) {
  // Walk up the DOM looking for a heading above this element
  let parent = el.parentElement;
  let depth = 0;
  while (parent && depth < 8) {
    // Look for heading siblings above
    for (const child of parent.children) {
      if (child === el || child.contains(el)) break;
      if (/^H[1-6]$/.test(child.tagName) || child.getAttribute("role") === "heading") {
        return cleanText(child.innerText);
      }
    }
    parent = parent.parentElement;
    depth++;
  }
  return "";
}

function cleanText(text) {
  return (text || "").replace(/\s+/g, " ").replace(/[*:]+$/, "").trim();
}

// ════════════════════════════════════════════════════════════════
// 4. PRECISION FILL ENGINE
// ════════════════════════════════════════════════════════════════

const nativeInputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
const nativeTextareaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;

function fireEvents(el) {
  ["input", "change", "blur", "keyup"].forEach((type) => {
    el.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
  });
  // React's SyntheticEvent
  const nativeInputEvent = new InputEvent("input", { bubbles: true, cancelable: true, data: el.value });
  el.dispatchEvent(nativeInputEvent);
}

function setTextValue(el, value) {
  const str = value === null || value === undefined ? "" : String(value);
  try {
    if (el.tagName === "TEXTAREA") {
      if (nativeTextareaSetter) nativeTextareaSetter.call(el, str);
      else el.value = str;
    } else {
      if (nativeInputSetter) nativeInputSetter.call(el, str);
      else el.value = str;
    }
    fireEvents(el);
  } catch (err) {
    el.value = str;
    fireEvents(el);
  }
}

function fillStandardField(el, value) {
  if (!el || value === null || value === undefined) return false;

  const type = (el.type || "text").toLowerCase();

  if (type === "file") return false; // handled separately

  if (type === "checkbox") {
    const boolVal = value === true || value === "true" || value === "1";
    if (el.checked !== boolVal) {
      el.click();
      fireEvents(el);
    }
    return true;
  }

  if (type === "radio") {
    if (!el.checked) {
      el.click();
      fireEvents(el);
    }
    return true;
  }

  if (el.tagName === "SELECT") {
    return fillSelect(el, String(value));
  }

  // Date inputs — try direct value first, then split
  if (type === "date") {
    return fillDateInput(el, String(value));
  }

  setTextValue(el, String(value));
  return true;
}

function fillSelect(selectEl, value) {
  const str = String(value).toLowerCase().trim();

  // Exact value match
  for (const opt of selectEl.options) {
    if (opt.value.toLowerCase() === str) {
      selectEl.value = opt.value;
      fireEvents(selectEl);
      return true;
    }
  }
  // Exact text match
  for (const opt of selectEl.options) {
    if (opt.text.toLowerCase().trim() === str) {
      selectEl.value = opt.value;
      fireEvents(selectEl);
      return true;
    }
  }
  // Starts-with text match
  for (const opt of selectEl.options) {
    if (opt.text.toLowerCase().trim().startsWith(str)) {
      selectEl.value = opt.value;
      fireEvents(selectEl);
      return true;
    }
  }
  // Partial match
  for (const opt of selectEl.options) {
    if (opt.text.toLowerCase().includes(str) || str.includes(opt.text.toLowerCase().trim())) {
      selectEl.value = opt.value;
      fireEvents(selectEl);
      return true;
    }
  }
  return false;
}

function fillDateInput(el, isoDateStr) {
  // isoDateStr could be "2022-03", "2022-03-15", "03/2022", etc.
  // Try setting directly first
  el.value = isoDateStr;
  fireEvents(el);
  if (el.value) return true;

  // Some ATSes use 3 separate sibling inputs: day, month, year
  const parent = el.closest("[data-date-group], fieldset") || el.parentElement;
  if (parent) {
    const parts = isoDateStr.match(/(\d{4})-(\d{2})(?:-(\d{2}))?/);
    if (parts) {
      const [, year, month, day] = parts;
      const dayEl = parent.querySelector("input[name*='day'], input[aria-label*='day'], input[placeholder*='DD']");
      const monthEl = parent.querySelector("input[name*='month'], input[aria-label*='month'], input[placeholder*='MM']");
      const yearEl = parent.querySelector("input[name*='year'], input[aria-label*='year'], input[placeholder*='YYYY']");
      if (dayEl && day) setTextValue(dayEl, day);
      if (monthEl) setTextValue(monthEl, month);
      if (yearEl) setTextValue(yearEl, year);
      return true;
    }
  }
  return false;
}

function fillRadioGroup(groupField, value) {
  if (!groupField.elements || !value) return false;
  const targetVal = String(value).toLowerCase().trim();

  for (const radio of groupField.elements) {
    const radioLabel = (getAssociatedLabelText(radio) || radio.value || "").toLowerCase().trim();
    const radioVal = (radio.value || "").toLowerCase().trim();

    if (radioVal === targetVal || radioLabel === targetVal || radioLabel.includes(targetVal) || targetVal.includes(radioVal)) {
      if (!radio.checked) {
        radio.click();
        fireEvents(radio);
      }
      return true;
    }
  }
  return false;
}

function fillCheckboxGroup(groupField, values) {
  if (!groupField.elements || !values) return false;
  const targets = Array.isArray(values) ? values.map((v) => String(v).toLowerCase()) : [String(values).toLowerCase()];
  let filled = false;

  for (const cb of groupField.elements) {
    const cbLabel = (getAssociatedLabelText(cb) || cb.value || "").toLowerCase().trim();
    const cbVal = (cb.value || "").toLowerCase().trim();
    const shouldCheck = targets.some((t) => t === cbVal || t === cbLabel || cbLabel.includes(t));

    if (shouldCheck && !cb.checked) {
      cb.click();
      fireEvents(cb);
      filled = true;
    }
  }
  return filled;
}

function setFileInput(fileInput, base64Data, filename, mimeType) {
  try {
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: mimeType || "application/pdf" });
    const file = new File([blob], filename || "Resume.pdf", { type: mimeType || "application/pdf", lastModified: Date.now() });
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;
    fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  } catch (err) {
    console.error("[ApplyDesk] File input error:", err);
    return false;
  }
}

function applyHighlight(el, status) {
  if (!el) return;
  const elements = el.elements ? el.elements : [el];
  for (const e of elements) {
    e.classList.remove("adk-filled-highlight", "adk-review-highlight", "adk-unmapped-highlight");
    if (status === "filled") {
      e.classList.add("adk-filled-highlight");
      setTimeout(() => e.classList.remove("adk-filled-highlight"), 5000);
    } else if (status === "draft") {
      e.classList.add("adk-review-highlight");
    } else if (status === "unmapped") {
      e.classList.add("adk-unmapped-highlight");
    }
  }
}

// ════════════════════════════════════════════════════════════════
// 5. CONTENT SCRIPT STATE & INIT
// ════════════════════════════════════════════════════════════════

let currentFields = [];
let capsuleRoot = null;
let mutationObserver = null;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initContentScript);
} else {
  initContentScript();
}

function initContentScript() {
  scanAndInjectCapsule();
  setupMutationObserver();
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.type === "TRIGGER_AUTOFILL") {
      scanAndInjectCapsule();
      handleFillTrigger().then(() => sendResponse({ status: "done" }));
      return true;
    }
  });
}

function setupMutationObserver() {
  if (mutationObserver) mutationObserver.disconnect();
  mutationObserver = new MutationObserver((mutations) => {
    const hasNewNodes = mutations.some((m) => m.addedNodes.length > 0);
    if (hasNewNodes) scanAndInjectCapsule();
  });
  mutationObserver.observe(document.body, { childList: true, subtree: true });
}

function scanAndInjectCapsule() {
  const fields = deepExtractFormFields();
  currentFields = fields;

  const eligibleCount = fields.filter((f) => f._hasElement).length;
  if (eligibleCount < 2) {
    removeCapsule();
    return;
  }
  injectCapsuleButton(eligibleCount);
}

function injectCapsuleButton(fieldCount) {
  if (document.getElementById("adk-capsule-root")) return;

  capsuleRoot = document.createElement("div");
  capsuleRoot.id = "adk-capsule-root";

  const btn = document.createElement("button");
  btn.className = "adk-capsule-btn";
  btn.id = "adk-fill-btn";
  btn.innerHTML = `<span class="adk-badge-icon">A</span><span>Fill with ApplyDesk</span>`;
  btn.addEventListener("click", () => handleFillTrigger());

  capsuleRoot.appendChild(btn);
  document.body.appendChild(capsuleRoot);
}

function removeCapsule() {
  const el = document.getElementById("adk-capsule-root");
  if (el) el.remove();
  capsuleRoot = null;
}

// ════════════════════════════════════════════════════════════════
// 6. MAIN AUTOFILL ORCHESTRATOR
// ════════════════════════════════════════════════════════════════

async function handleFillTrigger() {
  currentFields = deepExtractFormFields();

  ensureCapsuleExists();
  const btn = document.getElementById("adk-fill-btn");
  if (btn) btn.innerHTML = `<span class="adk-badge-icon">✨</span><span>Analyzing form...</span>`;

  let filledCount = 0;
  let draftCount = 0;
  const unmappedLabels = [];

  try {
    const settings = await getStoredSettings();
    const { baseUrl, token } = settings;

    if (!token) {
      showSummaryCard("⚠️ Set your token in extension options (⚙️) before autofilling.", "warning", 0, 0, 0);
      if (btn) btn.innerHTML = `<span class="adk-badge-icon">A</span><span>Fill with ApplyDesk</span>`;
      return;
    }

    // ── TIER 1: ATS-specific deterministic fill ──
    const atsMatch = matchAtsPattern(window.location.href);
    const tier1FieldIds = new Set();

    if (atsMatch && atsMatch.mappings.length > 0) {
      const profile = await fetchUserProfile(baseUrl, token);

      for (const mapItem of atsMatch.mappings) {
        const el = mapItem.element;
        if (!el) continue;

        if (mapItem.isFile) {
          const resumeUrl = profile?.resumeFile?.cloudinaryUrl || profile?.links?.resumeLink;
          if (resumeUrl) {
            await attachResumeToInput(el, resumeUrl);
            applyHighlight(el, "filled");
            filledCount++;
          } else {
            applyHighlight(el, "unmapped");
            unmappedLabels.push("Resume");
          }
        } else {
          const val = getProfileValueByKey(profile, mapItem.key);
          if (val) {
            fillStandardField(el, val);
            applyHighlight(el, "filled");
            filledCount++;
          } else {
            applyHighlight(el, "unmapped");
            unmappedLabels.push(mapItem.key);
          }
        }

        // Mark field as handled
        const matchedField = currentFields.find((f) => f.element === el);
        if (matchedField) tier1FieldIds.add(matchedField.fieldId);
      }
    }

    // ── TIER 2: LLM mapping for remaining fields ──
    if (btn) btn.innerHTML = `<span class="adk-badge-icon">🤖</span><span>LLM mapping fields...</span>`;

    const remainingFields = currentFields.filter((f) => !tier1FieldIds.has(f.fieldId));

    if (remainingFields.length > 0) {
      // Build serializable descriptors (strip DOM elements)
      const descriptors = remainingFields.map(serializeFieldDescriptor);

      const aiResponse = await requestAutofillMapping(baseUrl, token, {
        fields: descriptors,
        pageTitle: document.title,
        pageUrl: window.location.href,
        pageContext: extractPageContext(),
      });

      if (aiResponse && Array.isArray(aiResponse.mappings)) {
        for (const mapping of aiResponse.mappings) {
          const targetField = remainingFields.find((f) => f.fieldId === mapping.fieldId);
          if (!targetField) continue;

          const value = mapping.value;

          if (value === null || value === undefined || mapping.isUnmapped) {
            applyHighlight(targetField, "unmapped");
            if (targetField.label || targetField.groupLabel) {
              unmappedLabels.push(targetField.label || targetField.groupLabel);
            }
            continue;
          }

          let filled = false;

          if (targetField.domType === "radio-group") {
            filled = fillRadioGroup(targetField, value);
          } else if (targetField.domType === "checkbox-group") {
            filled = fillCheckboxGroup(targetField, value);
          } else if (targetField.type === "file" && targetField.element) {
            await attachResumeToInput(targetField.element, value);
            filled = true;
          } else if (targetField.element) {
            filled = fillStandardField(targetField.element, value);
          }

          if (filled) {
            applyHighlight(targetField, mapping.isDraft ? "draft" : "filled");
            if (mapping.isDraft) draftCount++;
            else filledCount++;
          } else {
            applyHighlight(targetField, "unmapped");
            unmappedLabels.push(targetField.label || targetField.groupLabel || "");
          }
        }
      }
    }

    const reviewCount = unmappedLabels.filter(Boolean).length;
    const snippet = unmappedLabels.filter(Boolean).slice(0, 3).join(", ");
    const msg = reviewCount > 0
      ? `Filled ${filledCount} fields — ${reviewCount} need attention: ${snippet}`
      : `✓ ${filledCount} fields filled successfully!`;
    showSummaryCard(msg, reviewCount > 0 ? "warning" : "success", filledCount, draftCount, reviewCount);

  } catch (err) {
    console.error("[ApplyDesk] Autofill error:", err);
    showSummaryCard(`Error: ${err.message}`, "warning", 0, 0, 0);
  } finally {
    if (btn) btn.innerHTML = `<span class="adk-badge-icon">A</span><span>Fill with ApplyDesk</span>`;
  }
}

// ════════════════════════════════════════════════════════════════
// 7. SERIALIZATION & API CALLS
// ════════════════════════════════════════════════════════════════

function serializeFieldDescriptor(field) {
  // Strip DOM elements — only keep serializable data
  const { element, elements, _hasElement, ...rest } = field;
  return rest;
}

function extractPageContext() {
  // Grab visible text from the page — job title, company name, requirements
  const body = document.body;
  const text = body.innerText || "";
  // Take up to 2000 chars from the top of the page
  return text.slice(0, 2000).trim();
}

async function getStoredSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["baseUrl", "token"], (result) => {
      resolve({
        baseUrl: result.baseUrl || "http://localhost:3000",
        token: result.token || "",
      });
    });
  });
}

async function fetchUserProfile(baseUrl, token) {
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      return data.profile || data;
    }
  } catch (_) {}
  return null;
}

async function requestAutofillMapping(baseUrl, token, payload) {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/autofill-map`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return await res.json();
}

async function attachResumeToInput(fileInput, resumeUrl) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "FETCH_RESUME_BLOB", url: resumeUrl }, (response) => {
      if (response?.success && response.base64) {
        setFileInput(fileInput, response.base64, response.filename || "Resume.pdf", response.mimeType || "application/pdf");
      }
      resolve();
    });
  });
}

function getProfileValueByKey(profile, key) {
  if (!profile) return null;
  const nameParts = (profile.name || "").trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

  // Current job — first isCurrent entry in workExperience
  const currentJob = (profile.workExperience || []).find((e) => e.isCurrent) || (profile.workExperience || [])[0];

  switch (key) {
    case "firstName":   return firstName;
    case "lastName":    return lastName;
    case "fullName":    return profile.name;
    case "email":       return profile.email;
    case "phone":       return profile.phone;
    case "location":    return profile.location;
    case "linkedin":    return profile.links?.linkedin;
    case "github":      return profile.links?.github;
    case "portfolio":   return profile.links?.portfolio;
    case "currentTitle":   return currentJob?.title || null;
    case "currentCompany": return currentJob?.company || null;
    default: return null;
  }
}

// ════════════════════════════════════════════════════════════════
// 8. UI: CAPSULE BUTTON + SUMMARY CARD
// ════════════════════════════════════════════════════════════════

function ensureCapsuleExists() {
  if (!document.getElementById("adk-capsule-root")) {
    capsuleRoot = document.createElement("div");
    capsuleRoot.id = "adk-capsule-root";
    const btn = document.createElement("button");
    btn.className = "adk-capsule-btn";
    btn.id = "adk-fill-btn";
    btn.innerHTML = `<span class="adk-badge-icon">A</span><span>Fill with ApplyDesk</span>`;
    btn.addEventListener("click", () => handleFillTrigger());
    capsuleRoot.appendChild(btn);
    document.body.appendChild(capsuleRoot);
  }
}

function showSummaryCard(msg, type, filled, draft, review) {
  ensureCapsuleExists();
  const existing = capsuleRoot?.querySelector(".adk-summary-card");
  if (existing) existing.remove();

  const card = document.createElement("div");
  card.className = "adk-summary-card";
  card.innerHTML = `
    <div class="adk-summary-header">
      <span>ApplyDesk Autofill</span>
      <button class="adk-close-btn" aria-label="Close">×</button>
    </div>
    <div class="adk-summary-body">${msg}</div>
    <div class="adk-summary-pills">
      ${filled > 0 ? `<span class="adk-pill adk-pill-green">✓ ${filled} Filled</span>` : ""}
      ${draft > 0  ? `<span class="adk-pill adk-pill-amber">✏️ ${draft} Drafted</span>` : ""}
      ${review > 0 ? `<span class="adk-pill adk-pill-amber">⚠️ ${review} Review</span>` : ""}
    </div>
  `;
  card.querySelector(".adk-close-btn").addEventListener("click", () => card.remove());
  capsuleRoot?.appendChild(card);
}
