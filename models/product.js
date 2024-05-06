const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  category: {
    type: String,
  },
  type: {
    type: String,
  },
  location: {
    type: String,
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  quantity: {
    type: Number,
  },
  images: {
    type: [String],
  },
  price: {
    type: Number,
  },
  negotiationType: {
    type: String,
  },
  warranty: {
    type: Boolean,
  },
  warrantyPeriod: {
    type: Number,
  },
  warrantyType: {
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  comments: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Comment",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Product = mongoose.model("Post", productSchema);

module.exports = Product;
