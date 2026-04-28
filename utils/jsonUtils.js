function extractFirstJsonObject(text) {
  const firstBrace = text.indexOf("{");
  if (firstBrace === -1) return null;

  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = firstBrace; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === "{") depth++;
      if (char === "}") depth--;

      if (depth === 0) {
        return text.slice(firstBrace, i + 1);
      }
    }
  }

  return null;
}

function safeParseModelJson(rawText) {
  try {
    return {
      success: true,
      data: JSON.parse(rawText)
    };
  } catch {
    try {
      const cleaned = rawText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      return {
        success: true,
        data: JSON.parse(cleaned)
      };
    } catch {
      try {
        const extracted = extractFirstJsonObject(rawText);

        if (!extracted) {
          throw new Error("No JSON found");
        }

        return {
          success: true,
          data: JSON.parse(extracted)
        };
      } catch (error) {
        return {
          success: false,
          error
        };
      }
    }
  }
}

module.exports = {
  extractFirstJsonObject,
  safeParseModelJson
};