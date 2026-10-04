const express = require("express");
const { getMain, getapijobs, postJobs, patchJobs, getspecificJob, getMainPendingJobs, getspecificJobforResumeGen } = require("../controllers/main.controller");
const router = express.Router();
const { restartAnalysis } = require("../controllers/main.controller");
// const { renderLatexPage } = require("../controllers/pageController");

router.get("/", getMain);
router.get("/api/jobs", getapijobs);
router.post("/api/jobs", postJobs);
router.patch("/api/jobs/:id/application-status", patchJobs);
router.post("/api/jobs/:id/restart-analysis", restartAnalysis);
router.get("/api/jobs/:id", getspecificJob);
router.get("/generate/resume/:id", getspecificJobforResumeGen);
router.get("/api/jobs/main/pending",getMainPendingJobs);




module.exports = router;
