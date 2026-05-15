const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");



// Legacy Version 
/*
function compileLatex(texFileName, workingDir) {
  return new Promise((resolve, reject) => {
    const pdflatexPath = "C:\\Program Files\\MiKTeX\\miktex\\bin\\x64\\pdflatex.exe";

    execFile(
      pdflatexPath,
      [
        "-interaction=nonstopmode",
        "-halt-on-error",
        "-file-line-error",
        texFileName
      ],
      {
        cwd: workingDir,
        timeout: 120000,
        windowsHide: true,
      },
      (error, stdout, stderr) => {
        const pdfPath = path.join(workingDir, "document.pdf");

        if (error) {
          return reject(
            new Error(
              [
                error.message,
                stdout,
                stderr
              ].filter(Boolean).join("\n")
            )
          );
        }

        if (!fs.existsSync(pdfPath)) {
          return reject(
            new Error(
              [
                "PDF was not generated.",
                stdout,
                stderr
              ].filter(Boolean).join("\n")
            )
          );
        }

        resolve({
          stdout,
          stderr,
          pdfPath,
        });
      }
    );
  });
}
*/

function compileLatex(texFileName, workingDir) {
  return new Promise((resolve, reject) => {
    execFile(
      "pdflatex",
      [
        "-interaction=nonstopmode",
        "-halt-on-error",
        "-file-line-error",
        texFileName,
      ],
      {
        cwd: workingDir,
        timeout: 120000,
        windowsHide: process.platform === "win32",
      },
      (error, stdout, stderr) => {
        const pdfPath = path.join(
          workingDir,
          texFileName.replace(/\.tex$/i, ".pdf")
        );

        if (error) {
          return reject(
            new Error([error.message, stdout, stderr].filter(Boolean).join("\n"))
          );
        }

        if (!fs.existsSync(pdfPath)) {
          return reject(
            new Error(["PDF was not generated.", stdout, stderr].filter(Boolean).join("\n"))
          );
        }

        resolve({ stdout, stderr, pdfPath });
      }
    );
  });
}



module.exports = { compileLatex };
