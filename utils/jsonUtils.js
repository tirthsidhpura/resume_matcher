const Joi = require("joi");


function extractFirstJsonObject(text) {
  const firstBrace = text.indexOf("{");
  if (firstBrace === -1) return null;

  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = firstBrace; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === "{") depth++;
      if (char === "}") depth--;

      if (depth === 0) {
        return text.slice(firstBrace, i + 1);
      }
    }
  }

  return null;
}

function safeParseModelJson(rawText) {
  try {
    return {
      success: true,
      data: JSON.parse(rawText)
    };
  } catch {
    try {
      const cleaned = rawText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      return {
        success: true,
        data: JSON.parse(cleaned)
      };
    } catch {
      try {
        const extracted = extractFirstJsonObject(rawText);

        if (!extracted) {
          throw new Error("No JSON found");
        }

        return {
          success: true,
          data: JSON.parse(extracted)
        };
      } catch (error) {
        return {
          success: false,
          error
        };
      }
    }
  }
}


const resumeSchema = Joi.object({
  summary: Joi.string().allow("").required(),

   skills: Joi.array()
    .items(
      Joi.object({
        category: Joi.string().allow("").required(),
        items: Joi.array()
          .items(Joi.string().allow(""))
          .default([])
      })
    )
    .default([]),

  experience: Joi.array()
    .items(
      Joi.object({
        job_title: Joi.string().allow("").required(),
        company: Joi.string().allow("").required(),
        location: Joi.string().allow("").required(),
        start_date: Joi.string().allow("").required(),
        end_date: Joi.string().allow("").required(),
        bullets: Joi.array().items(Joi.string().allow("")).default([])
      })
    )
    .default([]),

  projects: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().allow("").required(),
        link: Joi.string().allow("").required(),
        bullets: Joi.array().items(Joi.string().allow("")).default([])
      })
    )
    .default([])
});

function validateResumeJson(data) {
  return resumeSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
}
/*
(async () => {
  console.log(`test`);
  const json = {
"summary": "Software engineer with hands-on experience building production backend services, full-stack features, compliance platforms, ingestion workflows, APIs, dashboards, automation, and AI/ML-backed verification systems. Strong background in Node.js, React.js, Python, Django, FastAPI, Express, MongoDB, PostgreSQL, REST APIs, JWT, 2FA, RBAC, testing with Jest and PyTest, and Agile delivery for financial compliance systems handling sensitive investor and regulatory data.",
"skills": [
{
"category": "Backend & Full Stack",
"items": [
"Node.js, Express, Python, Django, FastAPI, React.js, TypeScript, REST APIs, JWT, RBAC, 2FA"
]
},
{
"category": "Databases & Data Systems",
"items": [
"MongoDB, PostgreSQL, SQL, NoSQL, schema design, audit trails, immutable records, data retention, time-stamped logging"
]
},
{
"category": "Async Processing & Pipelines",
"items": [
"Apache Kafka, WebSockets, child processes, streaming data, asynchronous processing, automated email notifications, PDF generation"
]
},
{
"category": "Testing & Delivery",
"items": [
"Jest, PyTest, Agile methodologies, production testing, deployment, maintenance, debugging, compliance reporting"
]
},
{
"category": "AI/ML & Automation",
"items": [
"AI/ML, KYC automation, document validation, human-review fallback, LLM-based email generation, YOLO-based computer vision"
]
}
],
"experience": [
{
"job_title": "Software Engineer",
"company": "Erience Solutions",
"location": "",
"start_date": "",
"end_date": "",
"bullets": [
"Delivered 2 enterprise-grade compliance platforms used by financial and listed entities across India, taking end-to-end ownership across design, implementation, testing, deployment, and maintenance.",
"Designed and developed a full-stack Registrar & Transfer Agent platform using React.js and Node.js to manage investor records, KYC verification, corporate actions, grievance handling, and regulatory compliance for multiple financial institutions.",
"Reduced unauthorized access incidents by approximately 70% by implementing role-based access control across User, Admin, and Super Admin panels with secure JWT-based authentication flows.",
"Integrated Two-Factor Authentication across all user roles, strengthening access security for systems handling sensitive investor records and SEBI-regulated data.",
"Reduced manual KYC verification effort by approximately 60% by building secure document upload workflows, verification status tracking, audit logs, and automated approval/rejection communication.",
"Cut report turnaround time from hours to under 1 minute by automating PDF generation for investor statements, compliance reports, and transaction summaries.",
"Improved response time by approximately 40% by building automated email notification systems for KYC updates, approvals, rejections, and investor communications.",
"Improved API performance by approximately 35% under peak load by optimizing investor data management APIs supporting issuance and transfer of securities, dividend processing, and corporate actions.",
"Built an AI-powered KYC verification engine to validate PAN, identity proofs, and address proofs, reducing manual review workload by approximately 65% through AI validation with human-review fallback.",
"Reduced verification errors by approximately 40% by integrating AI-based KYC checks into existing Node.js and Python backend services while preserving reviewer control for exception cases.",
"Built a SEBI-compliant Structured Digital Database for UPSI tracking across 1,000+ companies, supporting Regulation 3(5) requirements under SEBI PIT Regulations, 2015.",
"Reduced compliance risk by approximately 90% by implementing non-tamperable UPSI records, time-stamped audit trails, immutable entries, PAN mapping, justification records, and access-sharing history.",
"Improved compliance operations efficiency by approximately 50% by replacing manual and spreadsheet-based UPSI tracking with admin dashboards, compliance reporting tools, and long-term data preservation for 8+ years of record retention.",
"Tested backend and AI-supported workflows using Jest and PyTest, covering API behavior, service logic, and production-critical compliance flows.",
"Worked in Agile delivery cycles with direct ownership of customer requirements, shipped releases, production fixes, and continuous iteration for financial compliance users."
]
}
],
"projects": [
{
"name": "Cryptocurrency Price Alert System",
"link": "[https://github.com/tirthsidhpura/Crypto-Price-Alert-System](https://github.com/tirthsidhpura/Crypto-Price-Alert-System)",
"bullets": [
"Built a high-level cryptocurrency alert system that connects to Binance and KuCoin through WebSockets and listens to live prices for 300+ trading pairs simultaneously.",
"Used multiple child processes to separate real-time price listening and user alert execution, improving isolation between alert workloads.",
"Created a Kafka setup to stream price data to services that required market prices for downstream processing."
]
},
{
"name": "RSI Trading & Automation Platform",
"link": "[https://github.com/tirthsidhpura/rsi-calculation-binance](https://github.com/tirthsidhpura/rsi-calculation-binance)",
"bullets": [
"Built a multithreaded system to compute RSI indicators across 100+ trading pairs simultaneously using real-time market data.",
"Used WebSockets to stream generated RSI values for downstream trading and monitoring workflows.",
"Implemented automated trading strategies with stop-loss and take-profit logic using Binance APIs, including fault-tolerant order handling for real-time execution."
]
},
{
"name": "Vaulture",
"link": "[https://tirthsidhpura.github.io/portfolio/vaulture-project.html](https://tirthsidhpura.github.io/portfolio/vaulture-project.html)",
"bullets": [
"Built a full-stack TypeScript, Node.js, and React.js platform for creating dynamic forms, publishing them, collecting responses, and notifying form owners by email after each submission.",
"Implemented custom subdomains for user forms and hosted the platform on a private server with Cloudflare security.",
"Built a Super Admin panel to manage subscriptions, review reported forms, monitor suspicious activity, unpublish flagged forms, and send automated email alerts."
]
},
{
"name": "Hybrid Weather Data Engineering & Analytics Platform",
"link": "[https://tirthsidhpura.github.io/portfolio/hybrid-weather-app-project.html](https://tirthsidhpura.github.io/portfolio/hybrid-weather-app-project.html)",
"bullets": [
"Designed and implemented an end-to-end backend data pipeline ingesting real-time and historical weather data from multiple APIs.",
"Used Node.js and Apache Kafka to process asynchronous data streams reliably for downstream analytics workflows.",
"Stored and queried structured weather datasets using PostgreSQL and time-series techniques."
]
},
{
"name": "AI-Powered Dynamic Email Generation Platform",
"link": "",
"bullets": [
"Designed and implemented a production feature that generates dynamic, context-aware email content using structured inputs and stateful backend logic.",
"Persisted generated outputs and metadata in PostgreSQL to support auditing, iteration, and long-term maintenance.",
"Integrated the feature into existing workflows while balancing correctness, performance, and usability."
]
},
{
"name": "PaperOnBoard.in",
"link": "",
"bullets": [
"Built and scaled an educational platform serving over 10,000 daily users for GTU question papers, study material sharing, course information, and resume templates.",
"Developed backend services using PHP and SQL while managing production traffic and deployments.",
"Created and managed social media channels that supported consistent organic user growth."
]
},
{
"name": "Solana Token Swap & Launch Tracker",
"link": "[https://solana-frontend-psi.vercel.app/](https://solana-frontend-psi.vercel.app/)",
"bullets": [
"Built a decentralized web application for swapping SPL tokens on the Solana blockchain.",
"Implemented real-time detection of newly launched Solana tokens by directly querying Helius RPC without relying on third-party token listing APIs.",
"Designed a responsive frontend and integrated on-chain data fetching for fast and reliable token discovery and swaps."
]
}
]
}

// console.log(validateResumeJson(json))
})()
*/

function parseResumeData(content) {
  try {
    if (typeof content !== "string") {
      throw new Error("Expected content to be a string");
    }

    let text = content
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    // Remove real newlines that appear inside quoted JSON strings
    text = removeNewlinesInsideJsonStrings(text);

    const data = JSON.parse(text);

    return {
      summary: data.summary || "",
      skills: Array.isArray(data.skills) ? data.skills : [],
      experience: Array.isArray(data.experience) ? data.experience : [],
      projects: Array.isArray(data.projects) ? data.projects : []
    };
  } catch (error) {
    console.error("Parsing failed:", error.message);
    console.log("Raw content:", content);
    return null;
  }
}

function removeNewlinesInsideJsonStrings(str) {
  let result = "";
  let insideString = false;
  let escaped = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      result += char;
      escaped = true;
      continue;
    }

    if (char === '"') {
      insideString = !insideString;
      result += char;
      continue;
    }

    // If newline is inside a string, replace it with empty string
    if (insideString && (char === "\n" || char === "\r")) {
      continue;
    }

    result += char;
  }

  return result;
}


module.exports = {
  extractFirstJsonObject,
  safeParseModelJson,
  validateResumeJson,
  parseResumeData
};