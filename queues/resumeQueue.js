const { Queue } = require("bullmq");
const connection = require("../config/redis");

const resumeQueue = new Queue("resume-analysis-queue", {
  connection,
});

async function addResumeJob(jobData) {
  return await resumeQueue.add("analyze-resume", jobData, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  });
}

module.exports = {
  resumeQueue,
  addResumeJob,
};