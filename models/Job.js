const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema(
  {
    match_score: { type: Number, default: null },
    recommendation: { type: String, default: "" },
    company_name: { type: String, default: "" },
    resume_keywords: [{ type: String }],
    matched_keywords: [{ type: String }],
    missing_keywords: [{ type: String }],
    strong_matches: [{ type: String }],
    summary: { type: String, default: "" },
    parse_error: { type: Boolean, default: false },
    raw_response: { type: String, default: "" }
  },
  { _id: false }
);

const jobResumeSchema = new mongoose.Schema(
  {
    summary: {
      type: String,
      default: "",
    },
    skills: {
      type: [Object],
      default: [],
    },
    experience: {
      type: [Object],
      default: [],
    },
    projects: {
      type: [Object],
      default: [],
    },
  },
  { _id: false }
);
const jobSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      default: "",
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      default: "",
      trim: true
    },
    capturedAt: {
      type: Date,
      required: true
    },

    analysis: {
      type: analysisSchema,
      default: {}
    },
    jobResume: {
      type: jobResumeSchema,
      default: {}
    },
    jobResumeStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true
    },
    analysisStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true
    },
    
    analysisError: {
      type: String,
      default: ""
    },
    retryCount: {
      type: Number,
      default: 0
    },
    lastTriedAt: {
      type: Date,
      default: null
    },
    analyzedAt: {
      type: Date,
      default: null
    },
    jobResumecreatedAt: {
      type: Date,
      default: null
    },
    nextRetryAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    lockedAt: {
      type: Date,
      default: null,
      index: true
    },

    // NEW FIELD
    applicationStatus: {
      type: String,
      enum: ["not_applied", "applied", "rejected"],
      default: "not_applied",
      index: true
    },
    applicationStatusUpdatedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// unique only when url exists and is not empty
jobSchema.index(
  { url: 1 },
  {
    unique: true,
    partialFilterExpression: {
      url: { $type: "string", $ne: "" }
    }
  }
);

module.exports = mongoose.model("Job", jobSchema);