const { Worker } = require("bullmq");

const connection = require("../config/redis");
const { extractResumeTextFromPDF } = require("../services/pdfService");
const { analyzeJobWithMistral } = require("../services/aiService");
const Job = require ('../models/Job');
const wait = require("../utils/wait");
async function processOneJob(job) {
  const resumeText = await extractResumeTextFromPDF(job.resumePath);

  const analysis = await analyzeJobWithMistral(
    resumeText,
    job.description
  );

  console.log({analysis});

  return analysis;
}

function workerLoop() {
  console.log("[processing job]");

  const worker = new Worker(
    "resume-analysis-queue",
    async (bullJob) => {
      console.log("[bullmq job received]", bullJob.id);

      const job = bullJob.data;
      await wait(5000);
      return await processOneJob(job);
    },
    {
      connection,
      concurrency: 1,
      limiter: {
        max: 1,
        duration: 5000
      }
    }
  );

  worker.on("completed", async (job, result) => {
    console.log("[job completed]", job.id);
    console.log(result);
    console.log({job: job.data});

      await Job.findByIdAndUpdate(job.data._id, {
      $set: {
        analysis: result,
        analysisStatus: "completed",
        analysisError: "",
        analyzedAt: new Date(),
        lockedAt: null
      }
    });

    console.log(`saved `, job.data._id)
  });

  worker.on("failed", (job, error) => {
    console.error("[job failed]", job?.id, error.message);
  });

  return worker;
}

module.exports = workerLoop;