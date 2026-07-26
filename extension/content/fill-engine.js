/**
 * ApplyDesk Capture — Form Filling Engine
 * Implements native property setters (React compatibility), DataTransfer resume upload, and visual field highlighting.
 */

/**
 * Safely set value on an input/textarea/select element avoiding React/Vue state override issues.
 * @param {HTMLElement} element 
 * @param {string} value 
 */
export function setNativeValue(element, value) {
  if (!element) return;

  const stringValue = value === null || value === undefined ? "" : String(value);

  if (element.tagName === "SELECT") {
    element.value = stringValue;
    // Try matching option text if exact value match fails
    if (element.selectedIndex === -1 || !element.value) {
      for (let i = 0; i < element.options.length; i++) {
        const option = element.options[i];
        if (option.text.toLowerCase().includes(stringValue.toLowerCase())) {
          element.selectedIndex = i;
          break;
        }
      }
    }
  } else if (element.tagName === "TEXTAREA") {
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
    if (nativeSetter) {
      nativeSetter.call(element, stringValue);
    } else {
      element.value = stringValue;
    }
  } else if (element.tagName === "INPUT") {
    if (element.type === "checkbox" || element.type === "radio") {
      element.checked = Boolean(value);
    } else {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      if (nativeSetter) {
        nativeSetter.call(element, stringValue);
      } else {
        element.value = stringValue;
      }
    }
  }

  // Dispatch bubbling events to trigger framework reactive listeners
  element.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
  element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
  element.dispatchEvent(new Event("blur", { bubbles: true, cancelable: true }));
}

/**
 * Handle resume file upload on file inputs using DataTransfer
 * @param {HTMLInputElement} fileInput 
 * @param {ArrayBuffer|Uint8Array} fileData 
 * @param {string} filename 
 * @param {string} mimeType 
 */
export function setFileInput(fileInput, fileData, filename = "Resume.pdf", mimeType = "application/pdf") {
  if (!fileInput || fileInput.type !== "file") return false;

  try {
    const byteArray = fileData instanceof ArrayBuffer ? new Uint8Array(fileData) : fileData;
    const blob = new Blob([byteArray], { type: mimeType });
    const file = new File([blob], filename, { type: mimeType, lastModified: Date.now() });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;

    fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    fileInput.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  } catch (err) {
    console.error("Failed to attach file to file input:", err);
    return false;
  }
}

/**
 * Apply visual highlight feedback to a filled or drafted field
 * @param {HTMLElement} element 
 * @param {"filled"|"draft"|"unmapped"} status 
 */
export function applyFieldHighlight(element, status) {
  if (!element) return;

  if (status === "filled") {
    element.classList.add("adk-filled-highlight");
    setTimeout(() => {
      element.classList.remove("adk-filled-highlight");
    }, 4000);
  } else if (status === "draft" || status === "unmapped") {
    element.classList.add("adk-review-highlight");
    element.addEventListener(
      "focus",
      () => {
        element.classList.remove("adk-review-highlight");
      },
      { once: true }
    );
  }
}
