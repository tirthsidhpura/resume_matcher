const { APPLY_THRESHOLD } = require("../config/aiConfig.js");

function buildPrompt(resumeText, jobDescription) {
  return `
You are an ATS resume-job matching assistant.

Analyze the candidate resume against the job description.

IMPORTANT RULES:
- Return ONLY one valid JSON object.
- Do not return explanation.
- Do not return markdown.
- Do not return code fences.
- Do not return any text before or after the JSON.
- All keys must be present.
- match_score must be a number from 0 to 100.
- recommendation must be exactly "GOOD TO APPLY" or "NOT RECOMMENDED".
- resume_keywords, matched_keywords, missing_keywords, strong_matches must always be arrays.
- summary MUST be a non-empty string.
- summary MUST contain 2 to 4 sentences (minimum 30 words).
- summary MUST include:
  1. Overall fit of the candidate
  2. Strongest matching skills/experience
  3. Most important missing skills or gaps
- NEVER leave summary empty, even if data is limited.

Scoring rule:
- If match_score >= ${APPLY_THRESHOLD}, recommendation = "GOOD TO APPLY"
- If match_score < ${APPLY_THRESHOLD}, recommendation = "NOT RECOMMENDED"

Return exactly this JSON structure:
{
  "match_score": 0,
  "company_name": "company name || n/a",
  "recommendation": "GOOD TO APPLY",
  "resume_keywords": [],
  "matched_keywords": [],
  "missing_keywords": [],
  "strong_matches": [],
  "summary": "Write a clear 2-4 sentence evaluation here"
}

Resume:
${resumeText}

Job Description:
${jobDescription}
`.trim();
}

module.exports = {
  buildPrompt
};