
const fs = require("fs");
const path = require("path");
const Job = require("../models/Job");
const { addResumeJob } = require("../queues/resumeQueue");
const { RESUME_PDF_PATH } = require("../config/aiConfig.js");

async function claimNextJob() {
  console.log("claim next job");
const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const jobs = await Job.find({
    analysisStatus: "pending",
    createdAt: { $gte: last24Hours },
  });

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];

    await Job.findByIdAndUpdate(job._id, {
      analysisStatus: "queued",
      queuedAt: new Date(),
    });

      const absolutePath = path.resolve(RESUME_PDF_PATH);
    

    await addResumeJob({
      _id: job._id.toString(),
      resumePath: absolutePath,
      description: job.description,
      analysisRevision: job.analysisRevision || 0,
    });

    console.log("[job added to BullMQ]", job._id);
  }

  return jobs.length;
}

module.exports = {
  claimNextJob,
};
