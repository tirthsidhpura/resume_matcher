// resume_matcher.js
// Run: node resume_matcher.js

const fs = require("fs");
const path = require("path");

// ---------------- CONFIG ----------------
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby8cz_YhZO05xL1EPRXnwrvb27K8AaYdRVDxtDvZ9jEysdfFX-CIZ9slGR9oBi-aUwSMQ/exec";
const OLLAMA_URL = "http://localhost:11434/api/generate";
const MODEL = "mistral";

// Option 1: Keep resume text directly here
const RESUME_TEXT = `
Node.js developer with experience in MongoDB, REST APIs, Express.js, backend development,
authentication, deployment, API integration, and building scalable web applications.
`;

// Option 2: Or load from file
// const RESUME_TEXT = fs.readFileSync(path.join(__dirname, "resume.txt"), "utf8");

// Minimum score to recommend applying
const APPLY_THRESHOLD = 70;

// If your sheet returns a different field name, change this
const JOB_DESCRIPTION_FIELD = "description";
// ----------------------------------------

async function fetchJobsFromAppsScript() {
  const response = await fetch(APPS_SCRIPT_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch sheet data: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log({ response: data[0] })

  // Expected formats:
  // 1. Array directly: [{ job_description: "...", company: "...", role: "..." }]
  // 2. Wrapped object: { data: [...] }
//   console.log(Array.isArray(data))
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;

  throw new Error("Unexpected Apps Script response format. Expected array or { data: [...] }");
}

function buildPrompt(resumeText, jobDescription) {
  return `
You are an ATS resume-job matching assistant.

Compare the candidate resume with the job description.

Your task:
1. Extract the most relevant keywords, tools, skills, and requirements from the resume.
2. Compare them with the job description.
3. Calculate a realistic match percentage from 0 to 100.
4. Decide whether the candidate should apply.

Rules:
- If score >= ${APPLY_THRESHOLD}, recommendation should be "GOOD TO APPLY"
- If score < ${APPLY_THRESHOLD}, recommendation should be "NOT RECOMMENDED"
- Be practical, not overly generous.
- Consider skills, tools, frameworks, cloud, databases, backend experience, and role relevance.
- Output ONLY valid JSON.
- Do not add markdown or explanation outside JSON.

Return JSON in this exact format:
{
  "match_score": number,
  "recommendation": "GOOD TO APPLY" or "NOT RECOMMENDED",
  "resume_keywords": ["keyword1", "keyword2"],
  "matched_keywords": ["keyword1", "keyword2"],
  "missing_keywords": ["keyword1", "keyword2"],
  "strong_matches": ["point1", "point2"],
  "summary": "2-4 lines summary"
}

Resume:
${resumeText}

Job Description:
${jobDescription}
`.trim();
}

async function analyzeJob(resumeText, jobDescription) {
  const prompt = buildPrompt(resumeText, jobDescription);

  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  if (!result.response) {
    throw new Error("No response field found from Ollama API");
  }

  const rawText = result.response.trim();

  try {
    return JSON.parse(rawText);
  } catch (err) {
    return {
      parse_error: true,
      raw_response: rawText
    };
  }
}

async function main() {
  try {
    const jobs = await fetchJobsFromAppsScript();
    console.log(`Fetched ${jobs.length} jobs from sheet\n`);

    const finalResults = [];

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const jd = job[JOB_DESCRIPTION_FIELD];

      if (!jd || typeof jd !== "string" || !jd.trim()) {
        console.log(`Skipping row ${i + 1}: missing job description`);
        continue;
      }

      console.log(`Analyzing row ${i + 1}...`);

      const analysis = await analyzeJob(RESUME_TEXT, jd);

      const output = {
        row_number: i + 1,
        company: job.company || "",
        role: job.role || "",
        job_description: jd,
        analysis
      };

      finalResults.push(output);

      const score = analysis.match_score ?? "N/A";
      const recommendation = analysis.recommendation ?? "UNKNOWN";

      console.log(`Row ${i + 1} complete -> Score: ${score}, Recommendation: ${recommendation}\n`);
    }

    const outputPath = path.join(__dirname, "job_match_results.json");
    fs.writeFileSync(outputPath, JSON.stringify(finalResults, null, 2), "utf8");

    console.log(`Done. Results saved to: ${outputPath}`);

    const goodToApply = finalResults.filter(
      (item) =>
        item.analysis &&
        typeof item.analysis.match_score === "number" &&
        item.analysis.match_score >= APPLY_THRESHOLD
    );

    console.log(`\nGood to apply jobs: ${goodToApply.length}`);
  } catch (error) {
    console.log({error})
    console.error("Error:", error.message);
  }
}

main();