const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

const { RESUME_PDF_PATH } = require("../config/aiConfig.js");





async function extractResumeTextFromPDF() {
  const absolutePath = path.resolve(RESUME_PDF_PATH);

  // console.log({absolutePath})

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Resume PDF not found at: ${absolutePath}`);
  }

  const buffer = fs.readFileSync(absolutePath);
  const data = await pdfParse(buffer);

  const text = (data.text || "").trim();

  if (!text) {
    throw new Error("PDF extraction failed");
  }

  return text;
}

module.exports = {
  extractResumeTextFromPDF
};