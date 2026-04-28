

const Job = require("../models/Job");
const { normalizeUrl } = require("../utils/urlUtils");
const workerLoop = require("../workers/analysisWorker");

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
    
        res.render("index2", { jobs });
      } catch (error) {
        res.status(500).send("Failed to load dashboard");
      }
}



exports.getapijobs = async (req, res) => {
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

    if(process.env.aistop == 'false') {
    console.log("start")
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
}
