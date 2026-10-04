

const Job = require("../models/Job");
const path = require("path");
const { resumeQueue, addResumeJob } = require("../queues/resumeQueue");
const { RESUME_PDF_PATH } = require("../config/aiConfig");
const { generateResumeLatex } = require("../services/latexService");
const { normalizeUrl } = require("../utils/urlUtils");
const workerLoop = require("../workers/analysisWorker");
const { getUserProfileText, getPersonalInfoFromGoogleDoc } = require("../services/googleDocService");

exports.getMain = async (req, res) => {

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
    
        const userProfileText = await getUserProfileText();
        res.render("index", {
          jobs,
          userProfileText,
          googleDocUrl: process.env.GOOGLE_DOC_URL || process.env.RESUME_GOOGLE_DOC_URL || ""
        });
      } catch (error) {
        res.status(500).send("Failed to load dashboard");
      }
}



exports.getapijobs = async (req, res) => {
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

    res.json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}



exports.postJobs = async (req, res) => {
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
      // console.log(`url`, url)

      const existingJob = await Job.findOne({ url: normalizedUrl });
      if (existingJob) {
        // console.log(`Duplicate job already exists. Not stored and AI not triggered.`, existingJob)
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

    if(process.env.aistop == 'false') {
    // console.log("start")
    await workerLoop();
  }
    // workerLoop();

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
}


exports.patchJobs = async (req, res) => {
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
}

exports.restartAnalysis = async (req, res) => {
  const { id } = req.params;
  if (!/^[a-f\d]{24}$/i.test(id)) {
    return res.status(400).json({ success: false, message: "Invalid MongoDB job ID" });
  }
  let claimedJob;
  let enqueued = false;
  try {
    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    claimedJob = await Job.findOneAndUpdate(
      { _id: id, $or: [
        { analysisRevision: job.analysisRevision || 0 },
        ...(job.analysisRevision ? [] : [{ analysisRevision: { $exists: false } }]),
      ] },
      { $inc: { analysisRevision: 1 }, $set: { analysisStatus: "queued", analysisError: "", lockedAt: null } },
      { new: true }
    );
    if (!claimedJob) {
      return res.status(409).json({ success: false, message: "Another restart just occurred. Please retry." });
    }
    const previousJobs = await resumeQueue.getJobs(["active", "waiting", "delayed", "prioritized", "waiting-children", "failed", "completed"]);
    for (const previous of previousJobs) {
      if (previous.name !== "analyze-resume" || String(previous.data._id) !== id) continue;
      if ((previous.data.analysisRevision || 0) >= claimedJob.analysisRevision) continue;
      // A running entry stays locked, but its old revision cannot save a result.
      if (await previous.getState() === "active") continue;
      try {
        await previous.remove();
      } catch (error) {
        if (await previous.getState() !== "active") throw error;
      }
    }
    const queueId = `restart-analysis-${id}-${claimedJob.analysisRevision}`;
    const queued = await addResumeJob({
      _id: id,
      resumePath: path.resolve(RESUME_PDF_PATH),
      description: job.description,
      analysisRevision: claimedJob.analysisRevision,
    }, { jobId: queueId });
    enqueued = true;
    return res.status(202).json({ success: true, message: "AI analysis queued", queueJobId: queued.id });
  } catch (error) {
    if (claimedJob && !enqueued) {
      try {
        await Job.findOneAndUpdate({ _id: id, analysisRevision: claimedJob.analysisRevision }, { $set: {
          analysisStatus: "failed",
          analysisError: `Restart failed: ${error.message}`,
          lockedAt: null,
        } });
      } catch (rollbackError) {
        console.error("Failed to restore analysis status:", rollbackError);
      }
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};


exports.getspecificJob = async (req, res) => {
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
}

exports.getspecificJobforResumeGen = async (req, res) => {
     try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    // console.log({j: job.jobResume})
    const latex = await generateResumeLatex(job.jobResume);
    // console.log({latex})
    const personalInfo = await getPersonalInfoFromGoogleDoc();
    return res.render("latex",{
      success: true,
      data: job,
      personalInfo,
      sampleLatex: latex
    });
  } catch (error) {
    console.log({error})
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}




exports.getMainPendingJobs = async (req, res) => {
  try {

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
    // console.log({startDate, endDate})
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



    // console.log({data})
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
}
