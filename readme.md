# 🚀 AI Resume Matcher & Job Scraper (ATS System)

An intelligent **Applicant Tracking System (ATS)** that scrapes job listings from LinkedIn and Indeed, analyzes user resumes, and calculates a **percentage-based match score** to help job seekers find the best opportunities.

🌐 **Live Demo:** http://ats.paperonboard.in/

---

## 📌 Overview

This project is designed to **bridge the gap between job seekers and job descriptions** by providing a clear, data-driven understanding of how well a resume matches a job.

Instead of blindly applying to jobs, users can:

* Identify best-fit roles 🎯
* Improve their resumes 📄
* Increase interview chances 📈

---

## ✨ Features

### 🔍 Job Scraping

* Scrapes job listings from:

  * LinkedIn
  * Indeed
* Extracts:

  * Job title
  * Company name
  * Skills
  * Job description
  * Requirements

---

### 📄 Resume Parsing

* Supports:

  * PDF
  * DOCX
* Extracts:

  * Skills
  * Experience
  * Education
  * Keywords

---

### 🤖 AI Matching Engine

* Compares resume with job descriptions
* Uses:

  * Keyword matching
  * Skill overlap
  * Context relevance (optional NLP)
* Calculates:

  * Match percentage
  * Skill gaps

---

### 📊 Match Score System

* Provides:

  * % compatibility score
  * Ranked job list
* Helps users prioritize applications

---

### 💡 Smart Suggestions

* Highlights missing skills
* Suggests improvements
* Helps optimize resume for ATS systems

---

## 🧠 How It Works

1. 📤 User uploads resume
2. 🌐 System scrapes jobs from LinkedIn & Indeed
3. 🧾 Extracts keywords from:

   * Resume
   * Job descriptions
4. ⚙️ Matching algorithm runs:

   * Skill matching
   * Keyword similarity
   * Experience relevance
5. 📊 Outputs:

   * Match percentage
   * Missing skills
   * Recommendations

---

## ⚙️ Tech Stack

| Layer    | Technology                             |
| -------- | -------------------------------------- |
| Frontend | HTML, CSS, JavaScript / EJS            |
| Backend  | Node.js (Express)                      |
| Scraping | Puppeteer / Selenium                   |
| Parsing  | PDF-Parse / Mammoth                    |
| Database | MongoDB / MySQL                        |
| AI/NLP   | TF-IDF / Keyword Matching / Embeddings |
| Que   | REDIS / BULLMQ |

---

## 📈 Matching Algorithm

### Basic Formula:

```js
match_score = (matched_keywords / total_job_keywords) * 100;
```

### Advanced Enhancements:

* Weighted scoring (skills > tools > soft skills)
* Experience-based weighting
* Semantic similarity using embeddings
* Synonym detection (e.g., JS = JavaScript)

---

## 📂 Project Structure



---

## 🚀 Installation & Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/ats-resume-matcher.git
cd ats-resume-matcher
```

### 2️⃣ Install Dependencies



```bash
docker pull redis:latest
docker run --name redis-server -p 6379:6379 -d redis:latest
```
```bash
npm install
```

### 3️⃣ Run Project

```bash
npm start
```

Server will start on:

```
http://localhost:3000
```

---

## 📌 Usage

1. Upload your resume
2. Click **"Find Jobs"**
3. View:

   * Matching jobs
   * Match percentage
   * Missing skills
4. Improve resume based on suggestions

---

## 📊 Example Output

```
Job: Backend Developer
Match Score: 78%

Matched Skills:
✔ Node.js
✔ MongoDB
✔ REST APIs

Missing Skills:
✖ Docker
✖ Kubernetes

Suggestion:
→ Add Docker experience to improve match score to ~90%
```

---

## 🔐 Disclaimer

* This project is for **educational and research purposes only**
* Scraping LinkedIn/Indeed may violate their terms of service
* Use responsibly or switch to official APIs when possible

---

## 🚧 Future Improvements

* 🔥 ML-based matching model
* 🧠 GPT-based resume optimization
* 📊 Dashboard with analytics
* 📄 Resume auto-enhancer
* 🌍 Multi-job platform support
* 📱 Mobile-friendly UI

---

## 🤝 Contributing

Contributions are welcome!

Steps:

1. Fork the repo
2. Create a new branch
3. Commit your changes
4. Open a Pull Request

---

## 📜 License

MIT License

---

## 👨‍💻 Author

Built with ❤️ by **Tirth (Erience)**

---

## ⭐ Support

If you like this project:

* ⭐ Star the repo
* 🛠️ Contribute
* 📢 Share with others

---