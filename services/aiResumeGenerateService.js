const Job = require("../models/Job");
const mongoose = require("mongoose");
const { buildPromptforResume } = require("./promptService");
const { generateJobResumeWithAI } = require("./aiService");
const { generateResumeLatex } = require("./latexService");
const { compileLatex } = require("../utils/latexCompiler");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const os = require("os");
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/job_analyzer";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

async function generateAIresume(jd) {
  try {
    const prompt = await buildPromptforResume(jd);
    // console.log(prompt);

    const generateResume = await generateJobResumeWithAI(prompt);
    // console.log({generateResume});

    if (generateResume.success == true) {
      return generateResume.data;
    } else {
      throw new Error(`failed to generate a resume generateAIresume()`);
    }
  } catch (error) {
    console.log({ error });
  }
}

async function getDatafromMongodbforAIresume() {
  try {
    const job = await Job.findOne({
      "analysis.match_score": { $gt: 80 },
    });

    const gResume = await generateAIresume(job.description);
    console.log({ gResume });

    console.log({job: job._id})
    await Job.findByIdAndUpdate(job._id, {
      $set: {
        jobResume: gResume,
        jobResumeStatus: "completed",
        analysisError: "",
        jobResumecreatedAt: new Date(),
      },
    });


  } catch (error) {
    console.log(`error getDatafromMongodbforAIresume()`, error);
  }
}


function makeTempDir() {
  const unique = crypto.randomBytes(8).toString("hex");
  const dir = path.join(os.tmpdir(), `latex-${unique}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}


async function generateLatexResume() {
  const tempDir = makeTempDir();

  try {
    const job = await Job.findById("69c13dfc3fff246a08ead7ea");

    if (!job) {
      throw new Error("Job not found");
    }

    const latex = generateResumeLatex(job.jobResume);

    const texFilePath = path.join(tempDir, "document.tex");
    const pdfFilePath = path.join(tempDir, "document.pdf");

    fs.writeFileSync(texFilePath, latex, "utf8");

    await compileLatex("document.tex", tempDir);

    if (!fs.existsSync(pdfFilePath)) {
      throw new Error("PDF was not generated");
    }

    console.log("PDF generated successfully:", pdfFilePath);

    return pdfFilePath;
  } catch (error) {
    console.error("Generate LaTeX Resume Error:", error.message);
    throw error;
  }
}


(async () => {
  await generateLatexResume();
})();
