const {
  dataName,
  dataTitle,
  dataLocation,
  dataEmail,
  dataPhone,
  dataGithub,
  dataLinkedin,
  dataPortfolio,
  dataEducation,
  dataRelocation,
  dataResume,
  dataProjects
} = require("../config/personaldetails");

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

let cachedDocument = null;

function getGoogleDocId(url = "") {
  const match = String(url).match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : "";
}

function getGoogleDocExportUrl(url = "") {
  const docUrl = String(url).trim();
  if (!docUrl) return "";

  if (docUrl.includes("/export?format=txt") || docUrl.includes("output=txt")) {
    return docUrl;
  }

  const id = getGoogleDocId(docUrl);
  if (id) {
    return `https://docs.google.com/document/d/${id}/export?format=txt`;
  }

  return docUrl;
}

function getLocalProfileText() {
  return [
    `Name: ${dataName}`,
    `Title: ${dataTitle}`,
    `Location: ${dataLocation}`,
    `Email: ${dataEmail}`,
    `Phone: ${dataPhone}`,
    `GitHub: ${dataGithub}`,
    `LinkedIn: ${dataLinkedin}`,
    `Portfolio: ${dataPortfolio}`,
    `Education: ${dataEducation}`,
    `Relocation: ${dataRelocation}`,
    "",
    dataResume,
    "",
    dataProjects
  ].join("\n");
}

async function fetchGoogleDocText(url) {
  const exportUrl = getGoogleDocExportUrl(url);
  if (!exportUrl) return "";

  const response = await fetch(exportUrl);
  if (!response.ok) {
    throw new Error(`Google Doc request failed with ${response.status}`);
  }

  return response.text();
}

async function getUserProfileText(options = {}) {
  const url = options.url || process.env.GOOGLE_DOC_URL || process.env.RESUME_GOOGLE_DOC_URL || "";
  const fallbackText = getLocalProfileText();

  if (!url) {
    return fallbackText;
  }

  const ttlMs = Number(process.env.GOOGLE_DOC_CACHE_TTL_MS || DEFAULT_CACHE_TTL_MS);
  const now = Date.now();

  if (cachedDocument && cachedDocument.url === url && now - cachedDocument.fetchedAt < ttlMs) {
    return cachedDocument.text || fallbackText;
  }

  try {
    const text = (await fetchGoogleDocText(url)).trim();
    cachedDocument = {
      url,
      text: text || fallbackText,
      fetchedAt: now
    };
    return cachedDocument.text;
  } catch (error) {
    console.error("Google Doc profile fetch failed:", error.message);
    return cachedDocument?.text || fallbackText;
  }
}

function getFieldFromText(text, labels) {
  const lines = String(text || "").split(/\r?\n/);
  for (const line of lines) {
    for (const label of labels) {
      const pattern = new RegExp(`^\\s*${label}\\s*[:=-]\\s*(.+)$`, "i");
      const match = line.match(pattern);
      if (match) return match[1].trim();
    }
  }
  return "";
}

async function getPersonalInfoFromGoogleDoc() {
  const text = await getUserProfileText();

  return {
    name: getFieldFromText(text, ["name"]) || dataName,
    title: getFieldFromText(text, ["title", "role"]) || dataTitle,
    location: getFieldFromText(text, ["location"]) || dataLocation,
    email: getFieldFromText(text, ["email"]) || dataEmail,
    phone: getFieldFromText(text, ["phone", "mobile"]) || dataPhone,
    github: getFieldFromText(text, ["github", "git hub"]) || dataGithub,
    linkedin: getFieldFromText(text, ["linkedin", "linked in"]) || dataLinkedin,
    portfolio: getFieldFromText(text, ["portfolio", "website"]) || dataPortfolio,
    education: getFieldFromText(text, ["education"]) || dataEducation,
    relocation: getFieldFromText(text, ["relocation"]) || dataRelocation,
    resumeText: text
  };
}

module.exports = {
  getGoogleDocExportUrl,
  getUserProfileText,
  getPersonalInfoFromGoogleDoc
};
