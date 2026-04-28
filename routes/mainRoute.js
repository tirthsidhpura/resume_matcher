const express = require("express");
const { getMain, getapijobs, postJobs, patchJobs, getspecificJob, getMainPendingJobs } = require("../controllers/main.controller");
const router = express.Router();
// const { renderLatexPage } = require("../controllers/pageController");

router.get("/", getMain);
router.get("/api/jobs", getapijobs);
router.post("/api/jobs", postJobs);
router.patch("/api/jobs/:id/application-status", patchJobs);
router.get("/api/jobs/:id", getspecificJob);
router.get("/api/jobs/main/pending",getMainPendingJobs);




module.exports = router;