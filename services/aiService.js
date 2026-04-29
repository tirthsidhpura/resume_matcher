const { MODEL, OLLAMA_URL } = require("../config/aiConfig.js");

const { buildPrompt } = require("./promptService");
const { safeParseModelJson, validateResumeJson, safeParseModelJsonforResume, parseResumeData } = require("../utils/jsonUtils");

async function analyzeJobWithMistral(resumeText, jobDescription) {
  const prompt = buildPrompt(resumeText, jobDescription);

  // console.log({prompt})
  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: false,
    }),
  });

  const result = await response.json();

  const content = result.choices[0].message.content;

  const parsed = safeParseModelJson(content);

  if (!parsed.success) {
    throw new Error("Invalid JSON from model");
  }

  return parsed.data;
}

async function generateJobResumeWithAI(prompt) {
  // const prompt = buildPrompt(resumeText, jobDescription);

  // console.log({prompt})
  const response = await fetch('http://localhost:4000/v1/chat/completions', {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: false,
    }),
  });

  const result = await response.json();

  const content = result.choices[0].message.content;
  // const parsed = safeParseModelJson(content);

  // console.log(content)
  
const parsed = await parseResumeData(content);

// console.log({ parsed });

const { error, value } = validateResumeJson(parsed);

if (error) {
  console.error(error.details);
  throw new Error("Invalid JSON from model Resume Generator");
}

return {
  success: true,
  data: value,
};
}


// (async ()=> {
//   const planText = `{"summary":"Full-stack software engineer with experience building production-grade compliance platforms, backend services, and automation systems using Node.js, React.js, Python, TypeScript, PostgreSQL, and MongoDB. Built and scaled enterprise systems handling high-volume financial and investor data, AI-powered workflows, real-time streaming pipelines, and secure APIs. Experienced working across frontend, backend, testing, and deployment in Agile environments.","skills":["Node.js, TypeScript, JavaScript, Python, React.js, Express.js, Django, FASTAPI, REST APIs, PostgreSQL, MongoDB, Kafka, WebSockets, JWT, RBAC, 2FA, Jest, PyTest, AWS Concepts, OpenSearch Concepts, AI/ML Integration, Data Pipelines, ETL, Git, Agile Methodologies"],"experience":[{"job_title":"Software Engineer","company":"Erience Solutions","location":"India","start_date":"08/2024","end_date":"Present","bullets":["Designed and developed an enterprise Registrar & Transfer Agent (RTA) platform handling investor records, KYC verification, corporate actions, and compliance workflows for financial institutions.","Built full-stack services using React.js, Node.js, PostgreSQL, and MongoDB, owning architecture, backend APIs, frontend modules, deployment, and maintenance.","Implemented RBAC-based access control with User, Admin, and Super Admin panels, reducing unauthorized access incidents by approximately 70%.","Integrated Two-Factor Authentication (2FA) and JWT-based authentication flows to strengthen security and support SEBI compliance requirements.","Developed secure KYC workflows with document uploads, verification tracking, audit logs, and automated email notifications, reducing manual verification effort by approximately 60%.","Built AI-assisted KYC validation workflows using Python services integrated with existing Node.js backend systems, reducing manual review workload by approximately 65%.","Automated PDF generation for investor statements, compliance reports, and transaction summaries, reducing report generation time from hours to under one minute.","Optimized backend APIs and database operations to improve platform performance by approximately 35% under high-volume investor data loads.","Developed a SEBI-compliant Structured Digital Database (SDD) platform used to manage UPSI records for more than 1,000 companies.","Implemented immutable audit trails, PAN mapping, access history tracking, and long-term record retention mechanisms for regulatory traceability and compliance.","Built internal dashboards and compliance reporting tools used during SEBI audits and operational reviews.","Contributed to testing workflows using Jest and PyTest for backend services and API validation.","Worked in Agile development cycles, shipping features, fixes, and compliance updates in fast-paced production environments."]}],"projects":[{"name":"Vaulture","link":"https://tirthsidhpura.github.io/portfolio/vaulture-project.html","bullets":["Built
//  a full-stack dynamic form platform using TypeScript, Node.js, and React.js with workflows for publishing forms, collecting responses, and automated notifications.","Developed backend services and frontend modules enabling users to create customizable forms without technical setup.","Implemented automated email notification workflows triggered by form submissions and moderation events.","Built a Super Admin panel to monitor platform-wide reports, flags, subscriptions, and automatically unpublish suspicious forms.","Implemented custom subdomain support for user-generated forms and secured deployments behind Cloudflare."]},{"name":"Cryptocurrency Price Alert System","link":"https://github.com/tirthsidhpura/Crypto-Price-Alert-System","bullets":["Built
//  a real-time cryptocurrency monitoring system integrating Binance and KuCoin WebSocket streams across more than 300 trading pairs.","Designed multi-process backend architecture to handle concurrent alert processing and streaming workloads.","Implemented Kafka-based streaming pipelines to distribute live pricing data across dependent services and workflows."]},{"name":"Hybrid Weather Data Engineering & Analytics Platform","link":"https://tirthsidhpura.github.io/portfolio/hybrid-weather-app-project.html","bullets":["Designed
//  backend data pipelines ingesting real-time and historical weather datasets from multiple external APIs.","Used Node.js and Apache Kafka to process asynchronous streaming data reliably.","Stored and queried structured datasets using PostgreSQL and time-series data processing techniques."]},{"name":"AI-Powered Dynamic Email Generation Platform","link":"","bullets":["Built backend services generating context-aware email content using structured workflows and LLM-based logic.","Persisted generated outputs and metadata in PostgreSQL for auditing, iteration, and long-term maintenance.","Integrated AI-driven workflows into production systems while balancing performance, correctness, and maintainability."]},{"name":"RSI Trading & Automation Platform","link":"https://github.com/tirthsidhpura/rsi-calculation-binance","bullets":["Built
//  a multithreaded backend system to compute RSI indicators across more than 100 trading pairs simultaneously.","Processed low-latency market data streams using WebSockets and automated trading workflows.","Implemented stop-loss and take-profit execution logic integrated with Binance APIs."]},{"name":"PaperOnBoard.in","link":"","bullets":["Built and scaled an educational platform serving more than 10,000 daily users.","Developed backend services using PHP and SQL while managing production deployments and traffic.","Managed digital growth initiatives contributing to consistent organic platform adoption."]}]}`
//   console.log(await parseResumeData(planText))
// } )()

module.exports = {
  analyzeJobWithMistral,
  generateJobResumeWithAI,
};
