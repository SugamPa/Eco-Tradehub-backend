const router = require("express").Router();
const { ObjectId } = require("mongodb");
const Product = require("../models/product");
const auth = require("../middleware/auth");

router.post("/create", auth, async (req, res) => {
  const {
    title,
    description,
    category,
    type,
    location,
    latitude,
    longitude,
    price,
    images,
    negotiationType,
    warranty,
    warrantyPeriod,
    warrantyType,
  } = req.body;

  const requiredFields = [
    title,
    description,
    category,
    type,
    location,
    latitude,
    images,
    longitude,
    price,
    negotiationType,
  ];

  if (warranty && (!warrantyPeriod || !warrantyType)) {
    requiredFields.push(warrantyPeriod, warrantyType);
  }

  if (requiredFields.some((field) => !field)) {
    return res
      .status(400)
      .json({ message: "Please fill out all required fields" });
  }

  const userId = req.data.user_id;

  try {
    const productData = {
      title,
      description,
      category,
      type,
      location,
      latitude,
      longitude,
      images,
      warranty,
      price,
      negotiationType,
      userId: new ObjectId(userId),
    };

    if (warranty) {
      productData.warrantyPeriod = warrantyPeriod;
      productData.warrantyType = warrantyType;
    }

    const savedProduct = await Product.create(productData);

    const product = await Product.findById(savedProduct._id).populate({
      path: "userId",
      select: "name email avatar",
    });
    res.status(201).json({ message: "Product created successfully", product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/getProducts", async (req, res) => {
  try {
    const products = await Product.find().populate({
      path: "userId",
      select: "name email avatar",
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
