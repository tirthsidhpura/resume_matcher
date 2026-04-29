const { APPLY_THRESHOLD } = require("../config/aiConfig.js");
const Joi = require("joi");


function buildPrompt(resumeText, jobDescription) {
  return `
You are an ATS resume-job matching assistant.

Analyze the candidate resume against the job description.

IMPORTANT RULES:
- Return ONLY one valid JSON object.
- Do not return explanation.
- Do not return markdown.
- Do not return code fences.
- Do not return any text before or after the JSON.
- All keys must be present.
- match_score must be a number from 0 to 100.
- recommendation must be exactly "GOOD TO APPLY" or "NOT RECOMMENDED".
- resume_keywords, matched_keywords, missing_keywords, strong_matches must always be arrays.
- summary MUST be a non-empty string.
- summary MUST contain 2 to 4 sentences (minimum 30 words).
- summary MUST include:
  1. Overall fit of the candidate
  2. Strongest matching skills/experience
  3. Most important missing skills or gaps
- NEVER leave summary empty, even if data is limited.

Scoring rule:
- If match_score >= ${APPLY_THRESHOLD}, recommendation = "GOOD TO APPLY"
- If match_score < ${APPLY_THRESHOLD}, recommendation = "NOT RECOMMENDED"

Return exactly this JSON structure:
{
  "match_score": 0,
  "company_name": "company name || n/a",
  "recommendation": "GOOD TO APPLY",
  "resume_keywords": [],
  "matched_keywords": [],
  "missing_keywords": [],
  "strong_matches": [],
  "summary": "Write a clear 2-4 sentence evaluation here"
}

Resume:
${resumeText}

Job Description:
${jobDescription}
`.trim();
}


function buildPromptforResume(JD) {
const systemPrompt = `You are an expert technical recruiter and resume writer who specializes in ATS optimization (Greenhouse, Lever, Workday) and human recruiter readability.`;

    // ===== MAIN INSTRUCTION =====
    const mainInstruction = `
TASK:
Generate a job-specific resume in JSON format.

STRICT CONSTRAINTS (DO NOT VIOLATE):
- Return ONLY valid JSON. No explanations. No markdown. No extra text.
- DO NOT generate LaTeX.
- DO NOT change the JSON structure.
- DO NOT invent experience, tools, metrics, or companies.
- DO NOT use generic or motivational language.
- DO NOT sound like AI. Write like a strong engineer describing real work.
- Every bullet must be specific to actual work and NOT generic.

OUTPUT REQUIREMENTS:
- Modify ONLY content
- Keep JSON structure EXACTLY the same
- Only include relevant projects
- Prioritize recent experience
- Ensure ATS readability

CONTENT RULES:
1. MIRROR JD LANGUAGE EXACTLY
2. FRONT-LOAD IMPACT
3. METRICS OVER VAGUENESS
4. STRONG BULLETS
5. SKILLS = comma-separated
6. DATES = MM/YYYY
7. ATS OPTIMIZED
8. HUMAN READABLE
9. SHORT PROFESSIONAL SUMMARY
10. IMPACT OVER TASKS

VERY IMPORTANT:
- Experience must NOT look generic
- Use real work details only
`;

    // ===== CURRENT RESUME DATA =====
    const resumeData = `

Software Engineer – Erience Solutions (IT Company)
Tech Stack: Node.js, React.js, Python, Django, FASTAPI, Express, MongoDB, PostgreSQL, REST APIs, JWT, 2FA, AI/ML

Registrar & Transfer Agent (RTA) Management Software
Designed and developed an end-to-end Registrar & Transfer Agent (RTA) platform from scratch, handling investor records, KYC verification, corporate actions, and regulatory compliance, serving multiple financial institutions.
Built full-stack architecture (React.js frontend + Node.js backend), delivering 100% ownership of system design, development, deployment, and maintenance.
Implemented role-based access control (RBAC) with User, Admin, and Super Admin panels, improving operational control and reducing unauthorized access incidents by ~70%.
Integrated Two-Factor Authentication (2FA) across all user roles, strengthening security and meeting SEBI data confidentiality requirements.
Developed secure KYC workflows including document upload, verification status tracking, and audit logs, reducing manual verification effort by ~60%.
Automated PDF report generation (investor statements, compliance reports, transaction summaries), cutting report turnaround time from hours to under 1 minute.
Built automated email notification systems for KYC updates, approvals, rejections, and investor communications, improving response time by ~40%.
Designed and optimized investor data management modules supporting issuance & transfer of securities, dividend processing, corporate actions, and grievance handling.
Ensured SEBI compliance by implementing time-stamped audit trails, immutable records, and data retention policies, reducing compliance risk significantly.
Scaled the system to handle high-volume investor data with optimized APIs, improving performance by ~35% under peak load.

AI-Based KYC Automation System
Developed an AI-powered KYC verification engine to automatically validate identity documents (PAN, ID proofs, address proofs).
Reduced manual KYC review workload by ~65% by integrating AI validation with human-review fallback.
Improved KYC approval accuracy and consistency, reducing verification errors by ~40%.
Integrated AI workflows seamlessly into existing Node.js and Python backend services.

Structured Digital Database (SDD) Software – SEBI (PIT) Regulations, 2015
Built a SEBI-compliant Structured Digital Database (SDD) to manage Unpublished Price Sensitive Information (UPSI) for 1,000+ companies.
Designed a non-tamperable, internally hosted database with time-stamping and full audit trails, fully compliant with Regulation 3(5) of SEBI PIT Regulations.
Implemented strict RBAC controls, ensuring only authorized Compliance Officers and designated personnel could access UPSI data.
Developed secure logging of UPSI access, sharing history, PAN mapping, and justification records, enabling complete regulatory traceability.
Ensured data immutability, preventing edits or deletions once records were created, reducing compliance risk by ~90%.
Built admin dashboards and compliance reporting tools, simplifying SEBI inspections and internal audits.
Engineered long-term data preservation mechanisms to support 8+ years of mandatory record retention.
Improved compliance operations efficiency by ~50% compared to manual or spreadsheet-based tracking systems.


In erience solution I use to do testing as well using Jest, PyTest
We use Agile methodologies
Key Achievements & Impact
Delivered 2 enterprise-grade compliance platforms used by financial and listed entities across India.
Reduced manual operational workload by 50–65% through automation and AI integration.
Improved system security, auditability, and regulatory readiness, enabling clients to pass SEBI audits with zero critical observations.
Trusted to build mission-critical financial compliance systems handling sensitive investor and insider-trading data.
Projects




Cryptocurrency Price Alert System(only high level overview not actual system) (https://github.com/tirthsidhpura/Crypto-Price-Alert-System)
Created a system that connects to two exchange binance and kucoin via websocket and listen to the price of more than 300 pairs simultaneously through multiple child processes
Created a separate process for the each alert are set by the user 
Created a kafka setup where all this price is stream to the services which needed price of the particular service

Vaultutre (Full Stack Web App) (https://tirthsidhpura.github.io/portfolio/vaulture-project.html)
Built on typescript and nodejs, reactjs 
1 User Creates Form
2 Form is Published
3 Responses Collected
4 Email Notification Sent
5 Admin Can Monitor Flags


The platform allows users to create fully dynamic forms through an intuitive interface, making it easy to launch professional forms without technical complexity. Whether it is a simple feedback form or a more advanced structured workflow, Vaulture adapts seamlessly to different use cases.
Vaulture includes a powerful super admin panel used by the head team of the application to monitor all forms created by users across the platform. If a form receives a high number of user flags or suspicious activity, the admin can review and deactivate it to maintain platform trust, quality, and safety.
Custom subdomains for each user’s forms.
Superadmin panel to manage subscription and report functions to see form and unpublished it automatically with email alerts
When any user submit the form automated email goes to the form owner with response
Hosted it in private server with cloudflare security

RSI Trading & Automation Platform(https://github.com/tirthsidhpura/rsi-calculation-binance)
• Built a multithreaded system to compute RSI indicators across 100+ trading pairs simultaneously.
Used websockets to stream generated RSI
• Implemented automated trading strategies with stop-loss and take-profit logic using Binance APIs.
• Processed real-time market data with low-latency execution and fault-tolerant order handling.
PaperOnBoard.in
• Built and scaled an educational platform serving over 10,000 daily users.
• Developed backend services using PHP and SQL, managing production traffic and deployments.
• Created and managed social media channels, driving consistent organic user growth.
Hybrid Weather Data Engineering & Analytics Platform (https://tirthsidhpura.github.io/portfolio/hybrid-weather-app-project.html)
• Designed and implemented an end-to-end backend data pipeline ingesting real-time and historical data from multiple APIs.
• Used Node.js and Apache Kafka to process asynchronous data streams reliably.
• Stored and queried structured datasets using PostgreSQL and time-series techniques.
Python for Data Processing & ETL Support
https://github.com/tirthsidhpura/Python-Academic-Assignments
• Implemented Python scripts for data manipulation, transformation, and basic ETL-style workflows.
• Worked with structured datasets using SQL-style logic, control flows, and functions applicable to backend data processing
tasks.
• Demonstrates applied Python usage for backend services and data engineering support
AI-Powered Dynamic Email Generation Platform (LLM-Based)
• Designed and implemented a production feature generating dynamic, context-aware email content using structured inputs
and stateful logic.
• Built backend services to persist generated outputs and metadata in PostgreSQL for auditing, iteration, and long-term
maintenance.
• Integrated the feature into existing workflows, balancing correctness, performance, and usability.

\textbf{Solana Token Swap \& Launch Tracker}
https://solana-frontend-psi.vercel.app/
\begin{itemize}
\item Built a decentralized web application for swapping SPL tokens on the Solana blockchain.
\item Implemented real-time detection of newly launched Solana tokens by directly querying the Helius RPC, without relying on any third-party APIs.
\item Designed a responsive frontend and integrated on-chain data fetching to ensure fast, reliable, and trustless token discovery and swaps.
\end{itemize}

GSM Based DC Motor control system
Developed an IoT-based GSM DC Motor Control System using Arduino and embedded C, enabling remote control of motor speed through SMS commands via a GSM module. Implemented software logic to parse incoming GSM messages, process control commands, and adjust motor speed using PWM signals through a motor driver. The system also calculates and displays real-time RPM data on a 16×2 LCD. The project focused heavily on microcontroller programming, serial communication with the GSM module (AT commands), and real-time hardware–software integration for remote automation.
AI based Gas Detection system
Developed an AI-based Gas Detection System capable of identifying different odors such as perfume, deodorant, and other gases using gas sensors connected to a microcontroller. The system collects sensor data and applies machine learning techniques to classify different smell patterns. A software module processes real-time sensor readings, performs AI-based classification, and displays the detected gas type or triggers alerts when required. The project focuses on sensor data processing, pattern recognition, and embedded software integration for intelligent gas detection.


Achievement
Published paper on IEEE
Manual vehicle-damage inspection is slow, subjective, and costly for insurance and fleet operations. We present a real-time method to detect and classify exterior vehicle damage using YOLOv13. In contrast to previous work, we employ a two-stage, data-centric pipeline to (i) automatically filter vehicle photos by viewpoint, retaining only informative front and rear images, and (ii) address class imbalance by collecting additional photos and applying augmentation. We curated and labeled a balanced dataset of 4,000 images across three categories (bumper, rear bumper, windshield). On a hold-out validation set, our model achieves an mAP@0.5 of 0.789 and an F1-score of 0.76, with approximately 23 ms per image inference time on GPU, providing a favorable speed–accuracy trade-off. These properties support a realistic approach to automating insurance claims and fleet vehicle inspections at scale.

`;

    // ===== PROJECTS =====
    const projects = `
PROJECTS:

Cryptocurrency Price Alert System
- WebSocket system tracking 300+ trading pairs
- Multi-process architecture
- Kafka streaming

Vaulture
- Full stack TypeScript + React app
- Dynamic form builder
- Admin moderation system

RSI Trading Platform
- Multithreaded engine
- Real-time data processing

Hybrid Weather Data Platform
- Kafka pipeline
- PostgreSQL time-series

Python ETL System
- Data processing pipelines

AI Email Generator
- LLM-based system
`;

    // ===== JOB DESCRIPTION =====
    const jobDescription = JD;

    // ===== OUTPUT FORMAT =====
const outputFormat = `
RETURN JSON FORMAT:
{
  "summary": "",
  "skills": [
    {
      "category": "",
      "items": []
    }
  ],
  "experience": [
    {
      "job_title": "",
      "company": "",
      "location": "",
      "start_date": "",
      "end_date": "",
      "bullets": []
    }
  ],
  "projects": [
    {
      "name": "",
      "link": "",
      "bullets": []
    }
  ]
}
`;

    // ===== FINAL PROMPT =====
    const finalPrompt = `
${systemPrompt}

${mainInstruction}

${resumeData}


${jobDescription}

${outputFormat}
`;

return finalPrompt
}


module.exports = {
  buildPrompt,
  buildPromptforResume
};