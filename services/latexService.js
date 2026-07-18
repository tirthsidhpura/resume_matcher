const { dataName, dataTitle, dataLocation, dataEmail, dataPhone, dataGithub, dataLinkedin, dataPortfolio, dataEducation } = require("../config/personaldetails");
const { getPersonalInfoFromGoogleDoc } = require("./googleDocService");

function escapeLatex(value = "") {
  return String(value)
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

function formatLink(url) {
  if (!url) return "";
  const clean = url.replace(/^https?:\/\//, "");
  return `\\href{${escapeLatex(url)}}{${escapeLatex(clean)}}`;
}

async function generateResumeLatex(jobResume, personalInfo = null) {
  const googleDocInfo = personalInfo || await getPersonalInfoFromGoogleDoc();
    // console.log(`came`)
  const {
    name = dataName,
    title = dataTitle,
    location = dataLocation,
    email = dataEmail,
    phone = dataPhone,
    github = dataGithub,
    linkedin = dataLinkedin,
    portfolio = dataPortfolio,
    education = dataEducation,
    relocation = "Fully open and willing to relocate anywhere in Canada as required."
  } = googleDocInfo;

  const skillsLatex = jobResume.skills
    .map(skill => {
      const category = escapeLatex(skill.category);
      const items = skill.items.map(escapeLatex).join(", ");
      return `\\textbf{${category}} - ${items} \\\\`;
    })
    .join("\n");

  const experienceLatex = jobResume.experience
    .map(exp => {
      const bullets = exp.bullets
        .map(bullet => `\\item ${escapeLatex(bullet)}`)
        .join("\n\n");

      return `\\textbf{${escapeLatex(exp.job_title)}} \\\\
${escapeLatex(exp.company)} \\hfill ${escapeLatex(exp.start_date)} -- ${escapeLatex(exp.end_date)}
\\begin{itemize}

${bullets}

\\end{itemize}`;
    })
    .join("\n\n");

  const projectsLatex = jobResume.projects
    .map(project => {
      const title = escapeLatex(project.name);
      const link = project.link
        ? `\\href{${escapeLatex(project.link)}}{(GitHub Repository)}`
        : "";

      const bullets = project.bullets
        .map(bullet => `\\item ${escapeLatex(bullet)}`)
        .join("\n");

      return `\\textbf{${title}}${link}
\\begin{itemize}
${bullets}
\\end{itemize}`;
    })
    .join("\n\n");

  return `\\documentclass[10.5pt]{article}
\\usepackage[a4paper,margin=0.3in]{geometry}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{titlesec}

\\setlength{\\parindent}{0pt}
\\pagenumbering{gobble}
\\setlist[itemize]{noitemsep, topsep=2pt, leftmargin=*}

\\titleformat{\\section}
  {\\bfseries\\uppercase}
  {}
  {0pt}
  {}
  [\\titlerule]

\\begin{document}

\\begin{center}
{\\Large \\textbf{${escapeLatex(name)}}}\\\\
${escapeLatex(title)}\\\\
${escapeLatex(location)}\\\\
\\href{mailto:${escapeLatex(email)}}{${escapeLatex(email)}} - ${escapeLatex(phone)}\\\\
${formatLink(github)} - 
${formatLink(linkedin)} - 
${formatLink(portfolio)}
\\end{center}
    
\\section*{SUMMARY}
${escapeLatex(jobResume.summary)}

\\section*{SKILLS}

${skillsLatex}

\\section*{EXPERIENCE}

${experienceLatex}

\\section*{PROJECTS}

${projectsLatex}

\\section*{EDUCATION}

\\textbf{${escapeLatex(education)}} \\\\
\\textbf{${escapeLatex(relocation)}}

\\end{document}`;
}

module.exports = {
  generateResumeLatex
};
