const { Worker } = require("bullmq");

const connection = require("../config/redis");
const { extractResumeTextFromPDF } = require("../services/pdfService");
const { analyzeJobWithMistral } = require("../services/aiService");
const Job = require ('../models/Job');
const wait = require("../utils/wait");
const { getDatafromMongodbforAIresume } = require("../services/aiResumeGenerateService");
const { addCreateResumeJob } = require("../queues/resumeQueue");
const { APPLY_THRESHOLD } = require("../config/aiConfig");
function analysisFilter(job) {
  return { _id: job._id, $or: [
    { analysisRevision: job.analysisRevision || 0 },
    ...(job.analysisRevision ? [] : [{ analysisRevision: { $exists: false } }]),
  ] };
}
async function processOneJob(job) {
  await wait(10000);
  if (!await Job.exists(analysisFilter(job))) return null;
  const resumeText = await extractResumeTextFromPDF(job.resumePath);
  const analysis = await analyzeJobWithMistral(
    resumeText,
    job.description
  );


  return analysis;
}

function workerLoop() {
  console.log("[processing job]");

  const worker = new Worker(
    "resume-analysis-queue",
    async (bullJob) => {
      console.log("[bullmq job received]", bullJob.id);

      
      await wait(5000)
      if (bullJob.name == "generate-resume") {
        // generate resume logic
        console.log(`bullJob.name`, bullJob.name)
        // console.log(`bullJob.data._id`, bullJob.data.mongoId);
        return await getDatafromMongodbforAIresume(bullJob.data.mongoId)
      }
      else {
        const job = bullJob.data;
        const current = await Job.findOneAndUpdate(analysisFilter(job), { $set: {
          analysisStatus: "processing", lastTriedAt: new Date(), lockedAt: new Date(),
        } });
        if (!current) return null;
        return await processOneJob(job);

      }

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
    // console.log(result);
    // console.log({job: job.data});

    if (job.name == "generate-resume") {
      console.log(`resume generated successfully`);
    }
    else {
      if (!result) return;
      const saved = await Job.findOneAndUpdate(analysisFilter(job.data), {
      $set: {
        analysis: result,
        analysisStatus: "completed",
        analysisError: "",
        analyzedAt: new Date(),
        lockedAt: null
      }
    });
    if (!saved) return;


    if(result.match_score > APPLY_THRESHOLD) {

      console.log({mongodbIdforgeneratignresume: job.data._id})
      await addCreateResumeJob({
           _id: job.data._id,
           mongoId: job.data._id
         });

        

    }

    }

    console.log(`saved `, job.data._id)
  });

  worker.on("failed", async (job, error) => {
    console.error("[job failed]", job?.id, error.message);
    if (!job || job.name === "generate-resume") return;
    try {
      const retrying = job.attemptsMade < (job.opts.attempts || 1);
      await Job.findOneAndUpdate(analysisFilter(job.data), { $set: {
        analysisStatus: retrying ? "queued" : "failed",
        analysisError: error.message,
        retryCount: job.attemptsMade,
        lockedAt: retrying ? new Date() : null,
      } });
    } catch (saveError) {
      console.error("Failed to save analysis failure:", saveError);
    }
  });

  return worker;
}


/*
(async () => {
  console.log(`Only for testing line 105 worker,js`)
    await addCreateResumeJob({
           _id: "6a04640775a75b0530e40fac",
           mongoId: "6a04640775a75b0530e40fac"
         });
})()
// */

module.exports = workerLoop;
