const { Queue, delay } = require("bullmq");
const connection = require("../config/redis");

const resumeQueue = new Queue("resume-analysis-queue", {
  connection,
});

async function addResumeJob(jobData) {
  return await resumeQueue.add("analyze-resume", jobData, {
    attempts: 3,
    delay: 10000,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  });
}

async function addCreateResumeJob(jobData) {
  // console.log(`genereate rssume`, jobData)
  return await resumeQueue.add("generate-resume", jobData, {
    attempts: 3,
    delay: 10000,
    priority: 5,
    jobId: `3generate-resume-${jobData._id}`,
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
  addCreateResumeJob
};