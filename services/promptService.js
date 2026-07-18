const { APPLY_THRESHOLD } = require("../config/aiConfig.js");
const Joi = require("joi");
const { DataSystemPrompt, datamainInstruction, analysisPrompt } = require("../config/promptConfig.js");
const { getUserProfileText } = require("./googleDocService.js");


function buildPrompt(resumeText, jobDescription) {
  return `
${analysisPrompt}

Resume:
${resumeText}

Job Description:
${jobDescription}
`.trim();
}


async function buildPromptforResume(JD) {
const systemPrompt = DataSystemPrompt;

    // ===== MAIN INSTRUCTION =====
    const mainInstruction = datamainInstruction;

    // ===== CURRENT RESUME DATA =====
    const resumeData = await getUserProfileText();

    // ===== JOB DESCRIPTION =====
    const jobDescription = JD;

    // ===== OUTPUT FORMAT =====
const outputFormat = `
RETURN JSON FORMAT:
{
  "summary": "",
  "skills": [
    {
      "category": "",
      "items": []
    }
  ],
  "experience": [
    {
      "job_title": "",
      "company": "",
      "location": "",
      "start_date": "",
      "end_date": "",
      "bullets": []
    }
  ],
  "projects": [
    {
      "name": "",
      "link": "",
      "bullets": []
    }
  ]
}
`;

    // ===== FINAL PROMPT =====
    const finalPrompt = `
${systemPrompt}

${mainInstruction}

${resumeData}

${jobDescription}

${outputFormat}
`;

return finalPrompt
}


module.exports = {
  buildPrompt,
  buildPromptforResume
};
