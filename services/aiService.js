const { MODEL, OLLAMA_URL } = require("../config/aiConfig.js");

const { buildPrompt } = require("./promptService");
const { safeParseModelJson } = require("../utils/jsonUtils");

async function analyzeJobWithMistral(resumeText, jobDescription) {
  const prompt = buildPrompt(resumeText, jobDescription);

  // console.log({prompt})
  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      stream: false
    })
  });

  const result = await response.json();

  const content = result.choices[0].message.content;

  const parsed = safeParseModelJson(content);

  if (!parsed.success) {
    throw new Error("Invalid JSON from model");
  }

  return parsed.data;
}

module.exports = {
  analyzeJobWithMistral
};