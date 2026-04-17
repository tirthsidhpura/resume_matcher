const express = require("express");
const router = express.Router();
const { generatePdf } = require("../controllers/pdfController");

router.post("/generate-pdf", generatePdf);

module.exports = router;