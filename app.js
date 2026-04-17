require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const Job = require("./models/Job");
const cors = require("cors")
const pdfRoutes = require("./routes/pdfRoutes");
const pageRoutes = require("./routes/pageRoutes");

const app = express();

app.use(cors({
  origin: [
    "https://www.linkedin.com",
    "chrome-extension://*"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.options("*", cors());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/job_analyzer";
const API_SECRET = process.env.API_SECRET || "123456789";
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:4000/v1/chat/completions";
const MODEL = process.env.MODEL || "gpt-4o";
const APPLY_THRESHOLD = Number(process.env.APPLY_THRESHOLD || 65);
const RESUME_PDF_PATH = process.env.RESUME_PDF_PATH || "./storage/resume.pdf";

const MAX_RETRY_WINDOW_HOURS = 10;
const RETRY_DELAY_MS = 2 * 60 * 1000;
const WORKER_POLL_MS = 30000;
const LOCK_TIMEOUT_MS = 10 * 60 * 1000; // 10 min stale lock recovery

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


mongoose
.connect(MONGO_URI)
.then(() => console.log("MongoDB connected"))
.catch((err) => {
  console.error("MongoDB connection error:", err.message);
  process.exit(1);
});


// app.use("/api/pdf", pdfRoutes);

app.use("/page", pageRoutes);
app.use("/api/pdf", pdfRoutes);


async function extractResumeTextFromPDF() {
  const absolutePath = path.resolve(RESUME_PDF_PATH);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Resume PDF not found at: ${absolutePath}`);
  }

  const buffer = fs.readFileSync(absolutePath);
  const data = await pdfParse(buffer);

  const text = (data.text || "").trim();

  if (!text) {
    throw new Error("Resume PDF text extraction failed or PDF is empty");
  }

  return text;
}

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
  } catch (err1) {
    try {
      const cleaned = rawText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      return {
        success: true,
        data: JSON.parse(cleaned)
      };
    } catch (err2) {
      try {
        const extracted = extractFirstJsonObject(rawText);

        if (!extracted) {
          throw new Error("No JSON object found in model response");
        }

        return {
          success: true,
          data: JSON.parse(extracted)
        };
      } catch (err3) {
        return {
          success: false,
          error: err3
        };
      }
    }
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function analyzeJobWithMistral(resumeText, jobDescription) {
  // console.log("jobDescription", jobDescription)
  console.log("it is called")
  if(process.env.aistop == true) {
    return
  } 

  const prompt = buildPrompt(resumeText, jobDescription);
  // console.log({prompt})
  console.log("time")
  // await wait(30000);
  console.log("time end")

  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          "role": "user",
          "content": prompt
        }
      ],
        "stream": false,
  "temperature": 0.7,
  "max_tokens": 100
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
  }

  // console.log({response})
  const result = await response.json();
  // console.log({result});

  if (!result.choices) {
    throw new Error("No response field found from Ollama API");
  }

  const content = result.choices[0].message.content;
  // console.log({content})
  // const rawText = result.response.trim();
  const rawText = content;
  console.log({ rawText });

  const parsed = safeParseModelJson(rawText);
  console.log({parsed})

  if (!parsed.success) {
    console.log({ err: parsed.error });
    throw new Error("Model returned invalid JSON");
  }

  const data = parsed.data;

  return {
    match_score: typeof data.match_score === "number" ? data.match_score : null,
    recommendation:
      data.recommendation === "GOOD TO APPLY" || data.recommendation === "NOT RECOMMENDED"
        ? data.recommendation
        : "",
    company_name:
      data.company_name ,
    resume_keywords: Array.isArray(data.resume_keywords) ? data.resume_keywords : [],
    matched_keywords: Array.isArray(data.matched_keywords) ? data.matched_keywords : [],
    missing_keywords: Array.isArray(data.missing_keywords) ? data.missing_keywords : [],
    strong_matches: Array.isArray(data.strong_matches) ? data.strong_matches : [],
    summary: typeof data.summary === "string" ? data.summary : "",
    parse_error: false,
    raw_response: ""
  };
}

function isWithinRetryWindow(dateValue) {
  if (!dateValue) return false;
  const diffMs = Date.now() - new Date(dateValue).getTime();
  return diffMs < MAX_RETRY_WINDOW_HOURS * 60 * 60 * 1000;
}

let workerRunning = false;

async function recoverStaleProcessingJobs() {
  const staleTime = new Date(Date.now() - LOCK_TIMEOUT_MS);

  await Job.updateMany(
    {
      analysisStatus: "processing",
      lockedAt: { $lte: staleTime }
    },
    {
      $set: {
        analysisStatus: "pending",
        analysisError: "Recovered after server crash or stale processing lock",
        lockedAt: null,
        nextRetryAt: new Date()
      }
    }
  );
}

async function claimNextJob() {
  const now = new Date();

  return Job.findOneAndUpdate(
    {
      analysisStatus: "pending",
      nextRetryAt: { $lte: now },
      $or: [
        { lockedAt: null },
        { lockedAt: { $exists: false } }
      ]
    },
    {
      $set: {
        analysisStatus: "processing",
        lockedAt: now,
        lastTriedAt: now,
        analysisError: ""
      }
    },
    {
      sort: { createdAt: 1 },
      new: true
    }
  );
}

async function markRetry(job, errorMessage) {
  const canRetry = isWithinRetryWindow(job.createdAt);

  if (!canRetry) {
    await Job.findByIdAndUpdate(job._id, {
      $set: {
        analysisStatus: "failed",
        analysisError: errorMessage,
        lockedAt: null
      },
      $inc: { retryCount: 1 }
    });
    return;
  }

  await Job.findByIdAndUpdate(job._id, {
    $set: {
      analysisStatus: "pending",
      analysisError: errorMessage,
      lockedAt: null,
      nextRetryAt: new Date(Date.now() + RETRY_DELAY_MS)
    },
    $inc: { retryCount: 1 }
  });
}

function isValidAnalysisShape(data) {
  return (
    data &&
    typeof data === "object" &&
    typeof data.match_score === "number" &&
    data.match_score >= 0 &&
    data.match_score <= 100 &&
    (data.recommendation === "GOOD TO APPLY" ||
      data.recommendation === "NOT RECOMMENDED") &&
    Array.isArray(data.resume_keywords) &&
    Array.isArray(data.matched_keywords) &&
    Array.isArray(data.missing_keywords) &&
    Array.isArray(data.strong_matches) &&
    typeof data.summary === "string"
  );
}

async function processOneJob(job) {
  try {
    const resumeText = await extractResumeTextFromPDF();
    const analysis = await analyzeJobWithMistral(resumeText, job.description);

    if (!isValidAnalysisShape(analysis)) {
  throw new Error("Model returned JSON but not in expected format");
}

    await Job.findByIdAndUpdate(job._id, {
      $set: {
        analysis,
        analysisStatus: "completed",
        analysisError: "",
        analyzedAt: new Date(),
        lockedAt: null
      }
    });

    console.log(`Job ${job._id} analysis completed`);
  } catch (error) {
    console.log({error})
    console.error(`Job ${job._id} analysis failed:`, error.message);
    await markRetry(job, error.message);
  }
}

async function workerLoop() {
  console.log("process.env.aistop", process.env.aistop)
  if(process.env.aistop == 'true') {
    console.log("stop")
    return
  }



  // console.log("sta")
  if (workerRunning) return;
  workerRunning = true;
  // await wait(30000)

  try {
    await recoverStaleProcessingJobs();

    while (true) {
      const job = await claimNextJob();
      if (!job) break;

      await processOneJob(job);
      await wait(30000);

    }
  } catch (error) {
    console.error("Worker loop error:", error.message);
  } finally {
    workerRunning = false;
  }
}

setInterval(() => {
  workerLoop();
}, WORKER_POLL_MS);

// app.get("/", async (req, res) => {
//   try {
//     const jobs = await Job.find().sort({ createdAt: -1 });
//     res.render("index", { jobs });
//   } catch (error) {
//     res.status(500).send("Failed to load dashboard");
//   }
// });
app.get("/", async (req, res) => {
  try {
    const { date } = req.query; // e.g. ?date=23032026

    let filter = {};

    if (date) {
      const day = date.substring(0, 2);
      const month = date.substring(2, 4);
      const year = date.substring(4, 8);

      const startDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
      const endDate = new Date(`${year}-${month}-${day}T23:59:59.999Z`);

      filter.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const jobs = await Job.find(filter).sort({ createdAt: -1 });

    res.render("index", { jobs });
  } catch (error) {
    res.status(500).send("Failed to load dashboard");
  }
});

app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: jobs.length,
      workerRunning,
      data: jobs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


function normalizeUrl(rawUrl) {
  try {
    const u = new URL(rawUrl.trim());

    // hostname lowercase
    u.hostname = u.hostname.toLowerCase();

    // remove hash
    u.hash = "";

    // optional: remove tracking params
    const trackingParams = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
    trackingParams.forEach((p) => u.searchParams.delete(p));

    // remove trailing slash from pathname except root
    if (u.pathname.length > 1) {
      u.pathname = u.pathname.replace(/\/+$/, "");
    }

    return u.toString();
  } catch (err) {
    return rawUrl.trim();
  }
}

app.post("/api/jobs", async (req, res) => {
  try {
    const {
      secret,
      capturedAt,
      source,
      title,
      location,
      description,
      url
    } = req.body;

    // Uncomment if needed
    // if (!secret || secret !== API_SECRET) {
    //   return res.status(401).json({
    //     success: false,
    //     message: "Invalid secret"
    //   });
    // }

    if (!capturedAt || !source || !title || !description) {
      return res.status(400).json({
        success: false,
        message: "capturedAt, source, title, and description are required"
      });
    }

    const parsedDate = new Date(capturedAt);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid capturedAt format"
      });
    }

      const normalizedUrl = normalizeUrl(url);
    // fast duplicate check before insert
    if (url && url.trim()) {
      console.log(`url`, url)

      const existingJob = await Job.findOne({ url: normalizedUrl });
      if (existingJob) {
        console.log(`Duplicate job already exists. Not stored and AI not triggered.`, existingJob)
        return res.status(200).json({
          success: true,
          duplicate: true,
          message: "Duplicate job already exists. Not stored and AI not triggered.",
          data: existingJob
        });
      }

    }

    let savedJob;

    try {
      savedJob = await Job.create({
        source,
        title,
        location: location || "",
        description,
        url: normalizedUrl,
        capturedAt: parsedDate,
        analysisStatus: "pending",
        analysisError: "",
        analysis: {},
        retryCount: 0,
        lastTriedAt: null,
        analyzedAt: null,
        nextRetryAt: new Date(),
        lockedAt: null
      });
    } catch (error) {
      // protects against race condition duplicate inserts
      if (error.code === 11000) {
        const existingJob = await Job.findOne({ url: (url || "").trim() });
        return res.status(200).json({
          success: true,
          duplicate: true,
          message: "Duplicate job already exists. Not stored and AI not triggered.",
          data: existingJob
        });
      }
      throw error;
    }

    workerLoop();

    return res.status(201).json({
      success: true,
      duplicate: false,
      message: "Job saved successfully and added to persistent AI queue.",
      data: savedJob
    });
  } catch (error) {
    console.error("POST /api/jobs error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.patch("/api/jobs/:id/application-status", async (req, res) => {
  try {
    const { id } = req.params;
    const { applicationStatus } = req.body;

    const allowedStatuses = ["not_applied", "applied", "rejected"];

    if (!allowedStatuses.includes(applicationStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid applicationStatus"
      });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      id,
      {
        applicationStatus,
        applicationStatusUpdatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedJob) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    return res.json({
      success: true,
      message: "Application status updated successfully",
      job: updatedJob
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message
    });
  }
});
app.get("/api/jobs/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    return res.json({
      success: true,
      data: job
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


app.get("/api/jobs/main/pending", async (req, res) => {
  try {
    // const { date, dateField = "createdAt" } = req.query;

    // if (!date) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "date is required in format YYYY-MM-DD",
    //   });
    // }

    let date = "2026-03-20";
    let dateField = "createdAt"

    // Validate allowed date fields
    const allowedDateFields = ["createdAt", "capturedAt", "analyzedAt", "updatedAt"];
    if (!allowedDateFields.includes(dateField)) {
      return res.status(400).json({
        success: false,
        message: `dateField must be one of: ${allowedDateFields.join(", ")}`,
      });
    }

    // Start and end of the given day
    const startDate = new Date(`${date}T00:00:00.000Z`);
    const endDate = new Date(`${date}T23:59:59.999Z`);
    console.log({startDate, endDate})
    const query = {
      analysisStatus: { $ne: "completed" },
      [dateField]: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    const data2 = await Job.find(query).sort({ [dateField]: -1 }).lean();;
   const data = data2.map(item => ({
  ...item,
  resume: "nodejs, reactjs"
}));



    console.log({data})
    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Error fetching pending jobs:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

app.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);
  await workerLoop();
});