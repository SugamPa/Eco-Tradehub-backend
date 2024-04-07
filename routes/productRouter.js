const router = require("express").Router();
const { ObjectId } = require("mongodb");
const Product = require("../models/product");
const Comment = require("../models/comment");
const User = require("../models/user");
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

router.post("/comment", auth, async (req, res) => {
  const { id, commentText } = req.body;

  if (!commentText || !id) {
    return res
      .status(400)
      .json({ message: "Please fill all the required fields!" });
  }

  const userId = req.data.user_id;
  try {
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const initialComment = new Comment({
      commenter: userId,
      commentText,
    });
    await initialComment.save();

    product.comments.push(initialComment._id);
    await product.save();

    const user = await User.findById(userId);
    const comment = {
      _id: initialComment._id,
      commenter: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        userType: user.userType,
      },
      commentText: initialComment.commentText,
      createdAt: initialComment.createdAt,
      replies: initialComment.replies,
    };
    res.status(201).json({ message: "Comment added successfully", comment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/comments", auth, async (req, res) => {
  let { page, limit, productId } = req.query;
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 20;

  try {
    let comments;
    let totalCount;

    if (productId) {
      const product = await Product.findById(productId).select("comments");

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      comments = await Comment.find({ _id: { $in: product.comments } })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      totalCount = await Comment.countDocuments({ productId: productId });
    }

    if (!comments) {
      return res.status(404).json({ message: "Comments not found" });
    }
    const commentsToReturn = [];

    await Promise.all(
      comments.map(async (comment) => {
        const user = await User.findById(comment.commenter).exec();
        const commentToPush = {
          _id: comment._id,
          commenter: {
            _id: user._id,
            name: user.name,
            email: user.email,
          },
          commentText: comment.commentText,
          createdAt: comment.createdAt,
        };

        commentsToReturn.push(commentToPush);
      })
    );
    console.log(commentsToReturn);

    res.status(200).json({
      comments: commentsToReturn,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      totalComments: totalCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
