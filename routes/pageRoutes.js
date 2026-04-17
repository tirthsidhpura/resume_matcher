const express = require("express");
const router = express.Router();
const { renderLatexPage } = require("../controllers/pageController");

router.get("/", renderLatexPage);

module.exports = router;