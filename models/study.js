const mongoose = require("mongoose");

const studySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  url: {
    type: String,
    required: true,
  },
  category: {
    type: Array,
    required: true,
  },
  thumbnail: {
    type: String,
  },
});

const Study = mongoose.model("study", studySchema);

module.exports = Study;
