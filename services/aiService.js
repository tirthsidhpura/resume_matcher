const { MODEL, OLLAMA_URL } = require("../config/aiConfig.js");
const { buildPrompt } = require("./promptService");
const { safeParseModelJson, validateResumeJson, safeParseModelJsonforResume, parseResumeData } = require("../utils/jsonUtils");


async function callAnApi(prompt) {
  try {
    
    console.log({OLLAMA_URL})
   const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: false,
    }),
  });

  const result = await response.json();
  if (!response.ok || result.error) {
    const message = typeof result.error === "string" ? result.error : result.error?.message;
    throw new Error(`AI request failed (HTTP ${response.status}): ${message || response.statusText}`);
  }
  const content = result.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("AI API returned no message content in choices[0]");
  }
  return content;
  } catch (error) {
   console.error("AI request failed:", error.message);
   throw error;
  }
}


async function analyzeJobWithMistral(resumeText, jobDescription) {
  const prompt = buildPrompt(resumeText, jobDescription);
  const content = await callAnApi(prompt);
  const parsed = safeParseModelJson(content);
  if (!parsed.success) {
    throw new Error("Invalid JSON from model");
  }

  return parsed.data;
}

async function generateJobResumeWithAI(prompt) {

  const content = await callAnApi(prompt);  
  const parsed = await parseResumeData(content);


const { error, value } = validateResumeJson(parsed);

if (error) {
  console.error(error.details);
  throw new Error("Invalid JSON from model Resume Generator");
}

return {
  success: true,
  data: value,
};
}



module.exports = {
  analyzeJobWithMistral,
  generateJobResumeWithAI,
};
