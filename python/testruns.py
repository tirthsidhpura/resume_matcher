import re
import time
import fitz  # PyMuPDF
import spacy

from sklearn.feature_extraction.text import TfidfVectorizer, ENGLISH_STOP_WORDS
from sklearn.metrics.pairwise import cosine_similarity


nlp = spacy.load("en_core_web_sm")


def extract_text_from_pdf(pdf_path):
    text = ""

    with fitz.open(pdf_path) as pdf:
        for page in pdf:
            text += page.get_text("text") + "\n"

    return text


def clean_text(text):
    text = text.lower()

    text = re.sub(r"\bnode\s*js\b", "node.js", text)
    text = re.sub(r"\bnodejs\b", "node.js", text)
    text = re.sub(r"\bexpress\s*js\b", "express.js", text)
    text = re.sub(r"\bexpressjs\b", "express.js", text)
    text = re.sub(r"\bjava\s*script\b", "javascript", text)
    text = re.sub(r"\btype\s*script\b", "typescript", text)
    text = re.sub(r"\bpostgre\s*sql\b", "postgresql", text)
    text = re.sub(r"\bci\s*/?\s*cd\b", "ci/cd", text)
    text = re.sub(r"\brest\s*apis\b", "rest api", text)
    text = re.sub(r"\brest\s*api\b", "rest api", text)

    text = re.sub(r"[^a-zA-Z0-9+#./ -]", " ", text)
    text = re.sub(r"\s+", " ", text)

    return text.strip()


def remove_noise_from_jd(jd_text):
    """
    General cleanup for JD text.
    Removes common company/promotional/salary sections.
    """

    jd_text = jd_text.lower()

    stop_headings = [
        "about the company",
        "about us",
        "about akraya",
        "company overview",
        "equal opportunity",
        "benefits",
        "why join us",
        "join us",
        "about our client"
    ]

    for heading in stop_headings:
        if heading in jd_text:
            jd_text = jd_text.split(heading)[0]

    noisy_line_keywords = [
        "pay range",
        "salary",
        "contract type",
        "duration",
        "job id",
        "requisition",
        "posted",
        "applicants",
        "promoted",
        "no response",
        "award-winning",
        "best places to work",
        "glassdoor"
    ]

    useful_lines = []

    for line in jd_text.splitlines():
        line = line.strip()

        if not line:
            continue

        if any(noise in line for noise in noisy_line_keywords):
            continue

        useful_lines.append(line)

    return "\n".join(useful_lines)


def extract_keywords_with_tfidf(job_description, top_n=35):
    """
    Automatically extracts important JD keywords using TF-IDF.
    No predefined skills list.
    """

    jd_clean = clean_text(remove_noise_from_jd(job_description))

    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 3),
        max_features=top_n
    )

    tfidf_matrix = vectorizer.fit_transform([jd_clean])
    feature_names = vectorizer.get_feature_names_out()
    scores = tfidf_matrix.toarray()[0]

    keywords = [
        feature_names[i]
        for i in scores.argsort()[::-1]
        if len(feature_names[i]) > 2
    ]

    return keywords[:top_n]


def extract_keywords_with_spacy(job_description, top_n=35):
    """
    Automatically extracts noun chunks and technical-looking tokens using spaCy.
    """

    jd_clean = clean_text(remove_noise_from_jd(job_description))
    doc = nlp(jd_clean)

    keywords = set()

    for chunk in doc.noun_chunks:
        phrase = clean_text(chunk.text)

        words = phrase.split()

        if len(words) > 4:
            continue

        if len(phrase) > 2:
            keywords.add(phrase)

    for token in doc:
        token_text = clean_text(token.text)

        if (
            token_text
            and len(token_text) > 2
            and not token.is_stop
            and not token.is_punct
            and token.pos_ in ["NOUN", "PROPN", "ADJ"]
        ):
            keywords.add(token.lemma_.lower())

    keywords = list(keywords)

    return keywords[:top_n]


def extract_auto_keywords(job_description, top_n=35):
    """
    Combines TF-IDF and spaCy keywords.
    """

    tfidf_keywords = extract_keywords_with_tfidf(job_description, top_n)
    spacy_keywords = extract_keywords_with_spacy(job_description, top_n)

    combined = []

    for keyword in tfidf_keywords + spacy_keywords:
        keyword = clean_text(keyword)

        if keyword not in combined and len(keyword) > 2:
            combined.append(keyword)

    return combined[:top_n]


def keyword_exists(keyword, resume_text):
    resume_text = clean_text(resume_text)
    keyword = clean_text(keyword)

    if not keyword:
        return False

    # Exact phrase match
    if keyword in resume_text:
        return True

    # Partial match for multi-word keywords
    words = [
        word for word in keyword.split()
        if word not in ENGLISH_STOP_WORDS and len(word) > 2
    ]

    if len(words) >= 2:
        matched_words = sum(1 for word in words if word in resume_text)
        return matched_words / len(words) >= 0.7

    return False


def calculate_text_similarity(job_description, resume_text):
    jd_clean = clean_text(remove_noise_from_jd(job_description))
    resume_clean = clean_text(resume_text)

    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 3)
    )

    vectors = vectorizer.fit_transform([jd_clean, resume_clean])

    score = cosine_similarity(vectors[0], vectors[1])[0][0]

    return round(score * 100, 2)


def calculate_location_score(resume_text, location=None):
    if not location:
        return 0

    resume_clean = clean_text(resume_text)
    location_clean = clean_text(location)

    if location_clean in resume_clean:
        return 100

    location_words = location_clean.split()

    if any(word in resume_clean for word in location_words):
        return 70

    if "remote" in resume_clean:
        return 60

    return 0


def generate_suggestions(missing_keywords, final_score):
    suggestions = []

    if missing_keywords:
        suggestions.append(
            "Add these missing JD keywords naturally: "
            + ", ".join(missing_keywords[:12])
        )

    if final_score < 60:
        suggestions.append("Resume needs stronger customization for this job description.")
    elif final_score < 75:
        suggestions.append("Resume is a fair match. Improve missing keywords in experience and project sections.")
    else:
        suggestions.append("Resume is well aligned with this job description.")

    return suggestions


def analyze_resume_pdf(pdf_path, job_description, location=None, top_keywords=35):
    start_time = time.time()

    resume_text = extract_text_from_pdf(pdf_path)

    jd_keywords = extract_auto_keywords(job_description, top_keywords)

    matched_keywords = []
    missing_keywords = []

    for keyword in jd_keywords:
        if keyword_exists(keyword, resume_text):
            matched_keywords.append(keyword)
        else:
            missing_keywords.append(keyword)

    keyword_score = round(
        (len(matched_keywords) / len(jd_keywords)) * 100,
        2
    ) if jd_keywords else 0

    text_similarity_score = calculate_text_similarity(job_description, resume_text)

    location_score = calculate_location_score(resume_text, location)

    final_score = round(
        (keyword_score * 0.85) +
        (text_similarity_score * 0.10) +
        (location_score * 0.05),
        2
    )

    if final_score >= 75:
        decision = "GOOD TO APPLY"
    elif final_score >= 60:
        decision = "APPLY AFTER SMALL IMPROVEMENTS"
    else:
        decision = "NEEDS CUSTOMIZATION"

    end_time = time.time()

    return {
        "match_percentage": final_score,
        "decision": decision,
        "keyword_score": keyword_score,
        "text_similarity_score": text_similarity_score,
        "location_score": location_score,
        "total_keywords_found_from_jd": len(jd_keywords),
        "matched_keywords": matched_keywords,
        "missing_keywords": missing_keywords,
        "suggestions": generate_suggestions(missing_keywords, final_score),
        "processing_time_seconds": round(end_time - start_time, 4),
        "timestamp_start": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(start_time)),
        "timestamp_end": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(end_time))
    }

job_description = """
About the job

Position: Mechanical / Industrial Engineering Expert

Type: Hourly contract

Compensation: $75 $100/hour

Location: Remote

Commitment: Part-time, project-based with focused task execution

Role Responsibilities


Design structured engineering scenarios with deterministic evaluation rubrics
Create tasks involving design reviews, GD&T validation, and CAD model checks
Perform tolerance stack-up analysis and DFM/DFA evaluations
Develop change management scenarios including ECOs and BOM validation
Ensure all outputs are based on verifiable engineering specifications
Evaluate AI-generated outputs against defined technical and quality standards


Requirements


Bachelor s or Master s degree in Mechanical, Industrial, or Manufacturing Engineering
Strong experience in design, manufacturing engineering, or product development
Strong expertise with CAD tools such as SolidWorks, Creo, NX, CATIA, or similar
Strong understanding of GD&T, PLM systems, or manufacturing processes
Ability to create and interpret engineering artifacts such as drawings and BOMs
Strong written communication with step-by-step reasoning clarity
Strong attention to detail and analytical thinking
Ability to work independently and manage complex engineering tasks efficiently


Application Process (Takes 20 Mins)


Upload your resume.
Complete an interview.
Submit a short form.





Desired Skills and Experience

Engineering

"""

result = analyze_resume_pdf(
    pdf_path=r"D:\freelance\resume_matcher\storage\resume.pdf",
    job_description=job_description,
    location="toronto"
)

print(result)

