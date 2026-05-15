const { MODEL, OLLAMA_URL } = require("../config/aiConfig.js");
const { buildPrompt } = require("./promptService");
const { safeParseModelJson, validateResumeJson, safeParseModelJsonforResume, parseResumeData } = require("../utils/jsonUtils");


async function callAnApi(prompt) {
  try {
    
  
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
  return result.choices[0].message.content;
  } catch (error) {
   console.log({error}) 
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
