# 🚀 AI Resume Matcher & Job Scraper

A locally hosted resume-matching application that collects job postings, analyzes them against a user’s resume, and produces a structured ATS-style compatibility report.

The project runs entirely on the user’s machine using Node.js, MongoDB, Redis, BullMQ, Docker, and a locally configured AI model or API.

---

## 📌 Overview

The AI Resume Matcher helps job seekers decide which jobs are worth applying for.

Instead of manually reading every job description, users can save job postings, upload a resume, and let the system analyze the compatibility between the resume and each job.

For every analyzed job, the system provides:

* ATS match score
* Recommendation on whether to apply
* Matched keywords
* Missing keywords
* Strong skill matches
* Job and company information
* AI-generated summary

The application is designed to run locally. Users only need Docker, Git, and the project repository to start using it.

---

## ✨ Main Features

### 🔍 Job Collection

The application can collect job information from supported job platforms such as:

* LinkedIn
* Indeed

Job information can be captured through the configured scraper or browser-extension workflow.

The system stores information such as:

* Job title
* Company name
* Job URL
* Job description
* Location
* Required skills
* Required experience
* Technologies and keywords

> Job platform page structures can change, so scraper selectors may occasionally require updates.

---

### 📄 Resume Upload and Parsing

Users can upload their resume to the application.

Supported resume formats include:

* PDF
* DOCX, when configured

The backend extracts resume content such as:

* Technical skills
* Work experience
* Education
* Tools and technologies
* Certifications
* Relevant keywords

The parsed resume text is then used during job analysis.

---

### 🤖 AI-Powered ATS Analysis

Each job description is compared against the uploaded resume using an AI analysis service.

The AI returns a structured result containing:

```json
{
  "match_score": 78,
  "company_name": "Example Company",
  "job_title": "Backend Developer",
  "recommendation": "GOOD TO APPLY",
  "resume_keywords": [],
  "matched_keywords": [],
  "missing_keywords": [],
  "strong_matches": [],
  "summary": "The candidate has a strong overall match for this role..."
}
```

The recommendation follows this rule:

```text
Match score of 72 or higher → GOOD TO APPLY
Match score below 72 → NOT RECOMMENDED
```

The analysis considers:

* Technical skill overlap
* Resume keywords
* Job-description keywords
* Relevant experience
* Technologies and frameworks
* Role responsibilities
* Missing requirements
* Overall suitability

---

### 📊 Match Score and Recommendations

For every analyzed job, the application displays:

* Match score from 0 to 100
* Good-to-apply or not-recommended status
* Matching skills
* Missing skills
* Strong resume-to-job matches
* AI-generated explanation

This helps users prioritize high-quality applications instead of applying blindly.

---

### ⚙️ Background Job Processing

Resume and job analysis is processed asynchronously using:

* Redis
* BullMQ

When a job is submitted for analysis:

1. The backend creates an analysis job.
2. The job is added to a BullMQ queue.
3. An analysis worker receives the job.
4. The worker sends the resume and job description to the configured AI service.
5. The structured result is validated and saved.
6. The dashboard displays the completed analysis.

This prevents long-running AI requests from blocking the main Express server.

---

### 📋 Queue Monitoring

The project can use Bull Board to monitor BullMQ jobs.

The queue dashboard can display:

* Waiting jobs
* Active jobs
* Completed jobs
* Failed jobs
* Retry attempts
* Worker errors

This is useful for debugging job-analysis failures.

---

### 🗃️ Saved Job Management

Users can maintain a local database of jobs they are interested in.

Depending on the implemented interface, users can:

* Save job postings
* View collected jobs
* Start resume analysis
* Review analysis results
* Filter jobs by score or recommendation
* Track jobs by date
* Remove unwanted jobs

---

## 🧠 How the Application Works

### Step 1: Upload a Resume

The user uploads a resume through the local application.

The backend parses the resume and stores the extracted content.

### Step 2: Collect a Job Posting

A job posting is captured from a supported platform or added to the application.

The posting includes the job title, company, URL, and full job description.

### Step 3: Add the Analysis Job to the Queue

The backend sends the resume and job information to a BullMQ queue.

### Step 4: Process the Job

The analysis worker reads the queued job and calls the configured AI service.

The AI compares the job description against the resume.

### Step 5: Validate the Response

The system expects a valid JSON response with all required ATS-analysis fields.

### Step 6: Save the Result

The analysis result is saved to the database and connected to the corresponding job.

### Step 7: Review the Dashboard

The user can review:

* Match score
* Apply recommendation
* Matched keywords
* Missing keywords
* Strong matches
* Analysis summary

---

## ⚙️ Technology Stack

| Layer            | Technology                                       |
| ---------------- | ------------------------------------------------ |
| Frontend         | EJS, HTML, CSS, JavaScript                       |
| Backend          | Node.js, Express.js                              |
| Database         | MongoDB with Mongoose                            |
| Queue            | Redis and BullMQ                                 |
| Queue Dashboard  | Bull Board                                       |
| Resume Parsing   | PDF Parse                                        |
| Job Scraping     | Browser automation or browser-extension workflow |
| AI Analysis      | Configurable local AI model or external AI API   |
| Validation       | Joi                                              |
| HTTP Requests    | Axios or Fetch                                   |
| Development      | Nodemon                                          |
| Containerization | Docker and Docker Compose                        |

---

## 📂 Project Architecture

A simplified project structure may look like this:

```text
resume_matcher/
├── app.js
├── package.json
├── Dockerfile
├── docker-compose.yml
├── .env
│
├── config/
│   ├── database.js
│   └── redis.js
│
├── controllers/
│   ├── jobController.js
│   ├── resumeController.js
│   └── analysisController.js
│
├── models/
│   ├── Job.js
│   ├── Resume.js
│   └── Analysis.js
│
├── routes/
│   ├── jobRoutes.js
│   ├── resumeRoutes.js
│   └── analysisRoutes.js
│
├── services/
│   └── aiService.js
│
├── workers/
│   └── analysisWorker.js
│
├── queues/
│   └── analysisQueue.js
│
├── views/
│   ├── dashboard.ejs
│   ├── jobs.ejs
│   └── analysis.ejs
│
├── public/
│   ├── css/
│   └── js/
│
└── uploads/
```

The exact folder names may differ depending on the current repository structure.

---

## 🚀 Installation and Setup

### Prerequisites

Install the following software before starting:

* Git
* Docker Desktop
* Docker Compose

Node.js is only required when running the application outside Docker.

---

### 1. Clone the Repository

```bash
git clone https://github.com/tirthsidhpura/resume_matcher.git
cd resume_matcher
```

---

### 2. Configure Environment Variables

Create a `.env` file in the root directory.

Example:

```env
PORT=3000

MONGODB_URI=mongodb://mongo:27017/resume_matcher

REDIS_HOST=redis
REDIS_PORT=6379

AI_API_URL=http://app2:4000/v1/chat/completions
AI_MODEL=mistral
```

The exact variables may depend on the AI service and database configuration used in the project.

When services run inside Docker Compose, use Docker service names such as:

```env
REDIS_HOST=redis
AI_API_URL=http://app2:4000/v1/chat/completions
```

Do not use `localhost` to connect from one container to another.

---

### 3. Start the Application with Docker

```bash
docker compose up --build
```

To run the containers in the background:

```bash
docker compose up --build -d
```

Docker Compose starts the required services, which may include:

* Main Node.js application
* Redis
* MongoDB
* Local AI service
* BullMQ worker

---

### 4. Open the Application

After the containers start, open:

```text
http://localhost:3000
```

---

## 🛠️ Running Without Docker

Install Node.js, MongoDB, and Redis locally.

Install the project dependencies:

```bash
npm install
```

Start Redis:

```bash
docker run --name redis-server -p 6379:6379 -d redis:latest
```

Start the development server:

```bash
npm run dev
```

Or start the production command:

```bash
npm start
```

Make sure the MongoDB, Redis, and AI-service URLs in `.env` point to the correct local addresses.

Example:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/resume_matcher
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
AI_API_URL=http://127.0.0.1:4000/v1/chat/completions
```

---

## 📌 Usage

1. Start the application and its supporting services.
2. Open `http://localhost:3000`.
3. Upload or configure your resume.
4. Collect or add job postings.
5. Submit jobs for analysis.
6. Wait for the BullMQ worker to process them.
7. Open the analysis results.
8. Review the score, missing skills, and recommendation.
9. Prioritize the jobs marked `GOOD TO APPLY`.

---

## 📊 Example Analysis

```text
Job Title: Backend Developer
Company: Example Company
Match Score: 78%
Recommendation: GOOD TO APPLY

Strong Matches:
✔ Node.js
✔ Express.js
✔ MongoDB
✔ REST APIs
✔ Redis

Missing Keywords:
✖ Kubernetes
✖ AWS
✖ Terraform

Summary:
The candidate has a strong overall fit for the backend developer
position, particularly because of their Node.js, Express, MongoDB,
REST API, and Redis experience. The main gaps are cloud infrastructure,
Kubernetes, and Terraform.
```

---

## 🔄 BullMQ Processing Flow

```text
Job Posting
    ↓
Express Backend
    ↓
BullMQ Queue
    ↓
Redis
    ↓
Analysis Worker
    ↓
AI Service
    ↓
Validated JSON Result
    ↓
MongoDB
    ↓
Dashboard
```

---

## 🐳 Example Docker Compose Structure

A simplified Docker Compose setup may look like this:

```yaml
services:
  app:
    build: .
    container_name: node_app
    ports:
      - "3000:3000"
    env_file:
      - .env
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - redis
      - mongo
      - app2
    restart: unless-stopped
    command: npm run dev

  app2:
    build:
      context: ./main2/server
    container_name: ai_service
    ports:
      - "4000:4000"
    env_file:
      - ./main2/server/.env
    restart: unless-stopped

  redis:
    image: redis:7
    container_name: redis_db
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  mongo:
    image: mongo:7
    container_name: mongo_db
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

volumes:
  redis_data:
  mongo_data:
```

Update the paths and service configuration to match the repository.

---

## 🧪 Troubleshooting

### AI Service Returns `unknown scheme`

Make sure the API URL includes `http://` or `https://`.

Incorrect:

```env
AI_API_URL=app2:4000/v1/chat/completions
```

Correct:

```env
AI_API_URL=http://app2:4000/v1/chat/completions
```

---

### Connection Refused Between Containers

Use the Docker Compose service name instead of `localhost`.

Incorrect:

```env
AI_API_URL=http://localhost:4000/v1/chat/completions
```

Correct:

```env
AI_API_URL=http://app2:4000/v1/chat/completions
```

Inside the main application container, `localhost` refers to the main application container itself.

---

### Redis Connection Error

For Docker Compose:

```env
REDIS_HOST=redis
REDIS_PORT=6379
```

For local development:

```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

---

### Invalid AI Response

The AI service must return valid JSON containing every required ATS field.

The response should not contain:

* Markdown code fences
* Explanations before the JSON
* Explanations after the JSON
* Missing keys
* An empty summary

---

### Scraper Stops Working

LinkedIn and Indeed can change their HTML structure.

When this happens:

* Inspect the new page structure
* Update the selectors
* Check whether login is required
* Review rate limits and anti-bot restrictions
* Consider using approved APIs or user-triggered browser extraction

---

## 🔐 Privacy

The application is designed to run locally.

Resume data, saved jobs, and analysis results remain within the locally configured environment unless the user connects the project to an external AI API or remote database.

Before using an external AI provider, review its privacy and data-retention policies.

Do not commit the following files:

```text
.env
uploads/
resume files
API keys
database credentials
```

---

## ⚠️ Responsible Usage

This project is intended for:

* Personal use
* Educational use
* Research
* Portfolio demonstration
* Local productivity workflows

Automated scraping may be restricted by a website’s terms of service, robots policies, access controls, or applicable laws.

Users are responsible for ensuring that their usage complies with the rules of each platform.

Use official APIs, permitted data sources, or user-triggered extraction whenever possible.

---

## 🚧 Planned Improvements

* Browser extension for capturing job postings
* Support for more job platforms
* Improved job-status tracking
* Resume version management
* Custom scoring weights
* Embedding-based semantic similarity
* Better duplicate-job detection
* AI-generated resume improvements
* Resume generation for selected jobs
* Application analytics
* Interview tracking
* Authentication and multiple-user support
* Automated tests
* Improved Docker production configuration

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a new branch.

```bash
git checkout -b feature/your-feature-name
```

3. Commit your changes.

```bash
git commit -m "Add your feature"
```

4. Push the branch.

```bash
git push origin feature/your-feature-name
```

5. Open a pull request.

---

## 📜 License

This project is licensed under the MIT License.

See the `LICENSE` file for additional information.

---

## 👨‍💻 Author

Built by **Tirth Sidhpura**

GitHub:

```text
https://github.com/tirthsidhpura
```

Project repository:

```text
https://github.com/tirthsidhpura/resume_matcher
```

---

## ⭐ Support

To support the project:

* Star the repository
* Report bugs
* Suggest improvements
* Submit pull requests
* Share the project with other developers and job seekers
