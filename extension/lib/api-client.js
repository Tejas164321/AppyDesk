/**
 * ApplyDesk Extension API Client
 * Performs token-authenticated API calls to ApplyDesk backend
 */

export async function pingConnection(baseUrl, token) {
  const url = `${baseUrl.replace(/\/$/, "")}/api/extract`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text: "ApplyDesk Extension Ping Test" }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Connection test failed (HTTP ${res.status})`);
  }
  return data;
}

export async function extractJobDetails(baseUrl, token, { text, images }) {
  const url = `${baseUrl.replace(/\/$/, "")}/api/extract`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      text: text || "",
      images: images || [],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `AI Extraction failed (HTTP ${res.status})`);
  }
  return data;
}

export async function sendApplicationEmail(baseUrl, token, payload) {
  const url = `${baseUrl.replace(/\/$/, "")}/api/send`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...payload,
      source: "extension",
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Application send failed (HTTP ${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
