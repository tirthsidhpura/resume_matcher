const Job = require("../models/Job");
const { addResumeJob } = require("../queues/resumeQueue");

async function createAnalysisJob(data) {
  const job = await Job.create({
    resumePath: data.resumePath,
    description: data.description,
    analysisStatus: "pending",
  });

//   await addResumeJob({
//     _id: job._id.toString(),
//     resumePath: job.resumePath,
//     description: job.description,
//   });

//   console.log("[job added to BullMQ]", job._id);

//   return job;

}

module.exports = createAnalysisJob;