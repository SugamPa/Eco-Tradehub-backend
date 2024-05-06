const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
  },
  dateOfBirth: {
    type: Date,
  },
  password: {
    type: String,
    required: true,
  },
  avatarUrl: {
    type: String,
    default: null,
  },
  favorites: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Post",
    default: [],
  },
});

module.exports = mongoose.model("user", userSchema);
