const renderLatexPage = (req, res) => {
  const sampleLatex = `\\documentclass[10.5pt]{article}
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
{\\Large \\textbf{Tirth Sidhpura}}\\\\
Software Engineer\\\\
Toronto, ON, Canada\\\\
\\href{mailto:sidhpuratirth5126@gmail.com}{sidhpuratirth5126@gmail.com} - 548-333-1911\\\\
\\href{https://github.com/tirthsidhpura}{github.com/tirthsidhpura} -
\\href{https://www.linkedin.com/in/tirth-sidhpura/}{linkedin.com/in/tirth-sidhpura} -
\\href{https://tirthsidhpura.github.io/portfolio/}{tirthsidhpura.github.io/portfolio}
\\end{center}

\\section*{SUMMARY}
Software Engineer with 3+ years of experience designing scalable backend systems and building production-grade applications, including LLM-based features, AI workflows, and data-driven systems.

\\end{document}`;

  return res.render("latex", { sampleLatex });
};

module.exports = {
  renderLatexPage,
};