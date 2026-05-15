const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { compileLatex } = require("../utils/latexCompiler");
const axios = require("axios"); // add this at top if not already

function makeTempDir() {
  const unique = crypto.randomBytes(8).toString("hex");
  const dir = path.join(os.tmpdir(), `latex-${unique}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function sanitizeFilePart(value, fallback) {
  if (!value || typeof value !== "string") return fallback;

  const cleaned = value
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "");

  return cleaned || fallback;
}

function buildPdfFileName(fullName, phoneNumber, companyName) {
  const safeName = sanitizeFilePart(fullName, "UnknownName");
  const safePhone = sanitizeFilePart(phoneNumber, "UnknownPhone");
  const safeCompany = sanitizeFilePart(companyName, "UnknownCompany");

  return `${safeName}_${safePhone}_${safeCompany}.pdf`;
}

function cleanupTempDir(tempDir) {
  setTimeout(() => {
    fs.rm(tempDir, { recursive: true, force: true }, (err) => {
      if (err) {
        console.error("Cleanup error:", err.message);
      }
    });
  }, 3000);
}

const generatePdf = async (req, res) => {
  const { latex, fullName, phoneNumber, companyName } = req.body;

  // console.log("req.body =>", req.body);

  if (!latex || typeof latex !== "string") {
    return res.status(400).json({
      success: false,
      message: "latex is required and must be a string",
    });
  }

  const tempDir = makeTempDir();
  const texFilePath = path.join(tempDir, "document.tex");
  const pdfFilePath = path.join(tempDir, "document.pdf");
  const downloadFileName = buildPdfFileName(fullName, phoneNumber, companyName);

  try {
    fs.writeFileSync(texFilePath, latex, "utf8");

    await compileLatex("document.tex", tempDir);

    if (!fs.existsSync(pdfFilePath)) {
      throw new Error("PDF was not generated");
    }

    try {
  await axios.post("https://application-tracker-3huz.onrender.com/save", {
    fileName: companyName, // as requested
    createdWhen: "3 minutes ago by You",
    scrapedAt: new Date().toISOString(),
    pageUrl: "https://example.com/projects",
  });
} catch (apiError) {
  console.error("Save API error:", apiError.message);
}


    res.download(pdfFilePath, downloadFileName, (err) => {
      if (err) {
        console.error("Download error:", err.message);
      }

      cleanupTempDir(tempDir);
    });
  } catch (error) {
    cleanupTempDir(tempDir);

    return res.status(500).json({
      success: false,
      message: "Failed to generate PDF",
      error: error.message,
    });
  }
};

module.exports = {
  generatePdf,
};