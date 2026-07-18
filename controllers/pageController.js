const { getPersonalInfoFromGoogleDoc } = require("../services/googleDocService");

const renderLatexPage = async (req, res) => {
  const personalInfo = await getPersonalInfoFromGoogleDoc();

  return res.render("latex", {
    sampleLatex: personalInfo.resumeText,
    personalInfo,
    data: { analysis: { company_name: "" } }
  });
};

module.exports = {
  renderLatexPage,
};
