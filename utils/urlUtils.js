function normalizeUrl(rawUrl) {
  try {
    const u = new URL(rawUrl.trim());

    u.hostname = u.hostname.toLowerCase();
    u.hash = "";

    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content"
    ];

    trackingParams.forEach((p) => u.searchParams.delete(p));

    if (u.pathname.length > 1) {
      u.pathname = u.pathname.replace(/\/+$/, "");
    }

    return u.toString();
  } catch (err) {
    return rawUrl.trim();
  }
}

module.exports = {
  normalizeUrl
};