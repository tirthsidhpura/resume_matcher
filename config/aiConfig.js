require('dotenv').config()

module.exports ={
  APPLY_THRESHOLD: process.env.APPLY_THRESHOLD,
  RETRY_DELAY_MS: 30000,
  LOCK_TIMEOUT_MS: 5 * 60 * 1000,
  MAX_RETRY_WINDOW_HOURS: 24,
  WORKER_POLL_MS: 10000,
  MODEL: process.env.MODEL,
  OLLAMA_URL: process.env.OLLAMA_URL,
  RESUME_PDF_PATH: process.env.RESUME_PDF_PATH
};