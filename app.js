require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const Job = require("./models/Job");
const cors = require("cors")

const { ExpressAdapter } = require("@bull-board/express");
const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");

const { resumeQueue } = require("./queues/resumeQueue");

const pdfRoutes = require("./routes/pdfRoutes");
const pageRoutes = require("./routes/pageRoutes");
const mainRoutes = require("./routes/mainRoute");

const app = express();

app.use(cors({
  origin: [
    "https://www.linkedin.com",
    "chrome-extension://*"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.options("*", cors());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/job_analyzer";
const API_SECRET = process.env.API_SECRET || "123456789";
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:4000/v1/chat/completions";
const MODEL = process.env.MODEL || "gpt-4o";
const APPLY_THRESHOLD = Number(process.env.APPLY_THRESHOLD || 65);
const RESUME_PDF_PATH = process.env.RESUME_PDF_PATH || "./storage/resume.pdf";

const MAX_RETRY_WINDOW_HOURS = 10;
const RETRY_DELAY_MS = 2 * 60 * 1000;
const WORKER_POLL_MS = 30000;
const LOCK_TIMEOUT_MS = 10 * 60 * 1000; // 10 min stale lock recovery

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


mongoose
.connect(MONGO_URI)
.then(() => console.log("MongoDB connected"))
.catch((err) => {
  console.error("MongoDB connection error:", err.message);
  process.exit(1);
});


// app.use("/api/pdf", pdfRoutes);


app.use('/', mainRoutes)
app.use("/page", pageRoutes);
app.use("/api/pdf", pdfRoutes);

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(resumeQueue)],
  serverAdapter,
});

app.use("/admin/queues", serverAdapter.getRouter());



const workerLoop = require("./workers/analysisWorker");
const {claimNextJob} = require("./services/jobService");
const { createAiresume } = require("./services/aiResumeGenerateService");



app.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);
   if(process.env.aistop == 'false') {
    console.log("AI Analysis will be start")
    await workerLoop();

    await claimNextJob();
    // await createAiresume();
  }
});