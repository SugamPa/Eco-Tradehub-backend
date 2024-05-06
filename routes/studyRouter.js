const router = require("express").Router();
const Study = require("../models/study");

router.get("/get", async (req, res) => {
  try {
    const studyRes = await Study.find();
    res.json({
      study: studyRes,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/create", async (req, res) => {
  const { title, description, url, category, thumbnail } = req.body;
  try {
    const newStudy = new Study({
      title,
      description,
      url,
      category,
      thumbnail,
    });
    await newStudy.save();
    res.json({ message: "Study created", study: newStudy });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/delete", async (req, res) => {
  const { study_id } = req.body;
  try {
    await Study.findByIdAndDelete(study_id);
    res.json({ message: "Study deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
