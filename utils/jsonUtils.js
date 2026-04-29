const Joi = require("joi");


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


const resumeSchema = Joi.object({
  summary: Joi.string().allow("").required(),

   skills: Joi.array()
    .items(
      Joi.object({
        category: Joi.string().allow("").required(),
        items: Joi.array()
          .items(Joi.string().allow(""))
          .default([])
      })
    )
    .default([]),

  experience: Joi.array()
    .items(
      Joi.object({
        job_title: Joi.string().allow("").required(),
        company: Joi.string().allow("").required(),
        location: Joi.string().allow("").required(),
        start_date: Joi.string().allow("").required(),
        end_date: Joi.string().allow("").required(),
        bullets: Joi.array().items(Joi.string().allow("")).default([])
      })
    )
    .default([]),

  projects: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().allow("").required(),
        link: Joi.string().allow("").required(),
        bullets: Joi.array().items(Joi.string().allow("")).default([])
      })
    )
    .default([])
});

function validateResumeJson(data) {
  return resumeSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
}



function parseResumeData(planText) {
  try {
    const fixedText = planText
      // replace real line breaks inside your pasted JSON
      .replace(/\n\s+/g, " ")
      .replace(/\r/g, "")
      .trim();

    const data = JSON.parse(fixedText);

    return {
      summary: data.summary || "",
      skills: Array.isArray(data.skills) ? data.skills : [],
      experience: Array.isArray(data.experience) ? data.experience : [],
      projects: Array.isArray(data.projects) ? data.projects : []
    };
  } catch (error) {
    console.error("Parsing failed:", error.message);
    return null;
  }
}
module.exports = {
  extractFirstJsonObject,
  safeParseModelJson,
  validateResumeJson,
  parseResumeData
};