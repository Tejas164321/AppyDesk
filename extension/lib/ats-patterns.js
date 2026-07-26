/**
 * ApplyDesk Capture - Tier 1 Known ATS Platform Patterns
 * Lookup table for common field selectors on major ATS application forms.
 */

export const ATS_PLATFORMS = [
  {
    name: "Greenhouse",
    matchUrl: (url) => url.includes("greenhouse.io"),
    fieldRules: [
      { key: "firstName", selectors: ["#first_name", "input[name='first_name']", "input[id*='first_name']"] },
      { key: "lastName", selectors: ["#last_name", "input[name='last_name']", "input[id*='last_name']"] },
      { key: "fullName", selectors: ["#full_name", "input[name='full_name']"] },
      { key: "email", selectors: ["#email", "input[name='email']", "input[type='email']"] },
      { key: "phone", selectors: ["#phone", "input[name='phone']", "input[type='tel']"] },
      { key: "linkedin", selectors: ["input[name*='linkedin']", "input[id*='linkedin']", "input[name*='job_application[answers]'][id*='linkedin']"] },
      { key: "github", selectors: ["input[name*='github']", "input[id*='github']"] },
      { key: "portfolio", selectors: ["input[name*='portfolio']", "input[id*='portfolio']", "input[name*='website']"] },
      { key: "resume", selectors: ["#resume_file", "input[type='file'][name*='resume']", "input[type='file'][id*='resume']", "input[type='file']"], isFile: true }
    ]
  },
  {
    name: "Lever",
    matchUrl: (url) => url.includes("jobs.lever.co"),
    fieldRules: [
      { key: "fullName", selectors: ["input[name='name']"] },
      { key: "email", selectors: ["input[name='email']"] },
      { key: "phone", selectors: ["input[name='phone']"] },
      { key: "org", selectors: ["input[name='org']"] },
      { key: "linkedin", selectors: ["input[name='urls[LinkedIn]']", "input[name*='LinkedIn']"] },
      { key: "github", selectors: ["input[name='urls[GitHub]']", "input[name*='GitHub']"] },
      { key: "portfolio", selectors: ["input[name='urls[Portfolio]']", "input[name='urls[Other]']"] },
      { key: "resume", selectors: ["input[type='file'][name='resume']", "input[type='file']"], isFile: true }
    ]
  },
  {
    name: "Workday",
    matchUrl: (url) => url.includes("myworkdayjobs.com") || url.includes("workday.com"),
    fieldRules: [
      { key: "firstName", selectors: ["[data-automation-id='legalNameSection_firstName']", "input[id*='firstName']"] },
      { key: "lastName", selectors: ["[data-automation-id='legalNameSection_lastName']", "input[id*='lastName']"] },
      { key: "email", selectors: ["[data-automation-id='email']", "input[type='email']"] },
      { key: "phone", selectors: ["[data-automation-id='phone-number']", "input[type='tel']"] },
      { key: "linkedin", selectors: ["input[data-automation-id*='linkedin']", "input[id*='linkedin']"] },
      { key: "resume", selectors: ["[data-automation-id='file-upload-drop-zone'] input[type='file']", "input[type='file']"], isFile: true }
    ]
  },
  {
    name: "Ashby",
    matchUrl: (url) => url.includes("ashbyhq.com"),
    fieldRules: [
      { key: "firstName", selectors: ["input[name='_field_first_name']", "input[name*='first_name']"] },
      { key: "lastName", selectors: ["input[name='_field_last_name']", "input[name*='last_name']"] },
      { key: "fullName", selectors: ["input[name='_field_name']"] },
      { key: "email", selectors: ["input[name='_field_email']", "input[type='email']"] },
      { key: "phone", selectors: ["input[name='_field_phone']", "input[type='tel']"] },
      { key: "linkedin", selectors: ["input[name*='linkedin']"] },
      { key: "github", selectors: ["input[name*='github']"] },
      { key: "portfolio", selectors: ["input[name*='portfolio']", "input[name*='website']"] },
      { key: "resume", selectors: ["input[type='file']"], isFile: true }
    ]
  },
  {
    name: "iCIMS",
    matchUrl: (url) => url.includes("icims.com"),
    fieldRules: [
      { key: "firstName", selectors: ["input[id*='first_name']", "input[name*='firstName']"] },
      { key: "lastName", selectors: ["input[id*='last_name']", "input[name*='lastName']"] },
      { key: "email", selectors: ["input[id*='email']", "input[name*='email']"] },
      { key: "phone", selectors: ["input[id*='phone']", "input[name*='phone']"] },
      { key: "linkedin", selectors: ["input[id*='linkedin']", "input[name*='linkedin']"] },
      { key: "resume", selectors: ["input[type='file']"], isFile: true }
    ]
  }
];

/**
 * Match current page URL and DOM against Tier 1 ATS patterns
 * @param {string} url 
 * @param {Document} doc 
 * @returns {{ platform: string, mappings: Array<{ selector: string, key: string, isFile?: boolean }> } | null}
 */
export function matchAtsPattern(url, doc = document) {
  const currentUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const platform = ATS_PLATFORMS.find((p) => p.matchUrl(currentUrl));

  if (!platform) return null;

  const foundMappings = [];

  for (const rule of platform.fieldRules) {
    for (const selector of rule.selectors) {
      try {
        const el = doc.querySelector(selector);
        if (el && isVisibleElement(el)) {
          foundMappings.push({
            selector,
            key: rule.key,
            isFile: !!rule.isFile,
            element: el,
          });
          break; // move to next rule once matched
        }
      } catch (err) {
        // ignore invalid selector
      }
    }
  }

  return {
    platform: platform.name,
    mappings: foundMappings,
  };
}

function isVisibleElement(el) {
  if (!el) return false;
  const style = window.getComputedStyle ? window.getComputedStyle(el) : null;
  if (style && (style.display === "none" || style.visibility === "hidden")) {
    return false;
  }
  // File inputs may have opacity 0 or width 0 inside custom wrappers, so accept file inputs
  if (el.type === "file") return true;
  return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
}
