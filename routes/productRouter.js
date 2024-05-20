const router = require("express").Router();
const { ObjectId } = require("mongodb");
const Product = require("../models/product");
const Comment = require("../models/comment");
const User = require("../models/user");
const auth = require("../middleware/auth");
const Purchase = require("../models/purchases");
const mailSender = require("../utils/mailSender");

router.post("/create", auth, async (req, res) => {
  const {
    title,
    description,
    category,
    type,
    location,
    latitude,
    longitude,
    quantity,
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
    quantity,
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
      quantity,
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
      select: "name email phoneNumber avatarUrl",
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
      select: "name email phoneNumber avatarUrl",
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/my", auth, async (req, res) => {
  const userId = req.data.user_id;

  try {
    const products = await Product.find({
      userId: new ObjectId(userId),
    }).populate({
      path: "userId",
      select: "name email phoneNumber avatarUrl",
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/delete", auth, async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: "Product ID is required" });
  }

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.userId.toString() !== req.data.user_id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this product" });
    }

    await Product.findByIdAndDelete(id);
    res.json({ message: "Product deleted" });
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
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl,
        userType: user.userType,
      },
      commentText: initialComment.commentText,
      createdAt: initialComment.createdAt,
      replies: initialComment.replies,
    };
    res.status(201).json({ message: "Comment added successfully", comment });
  } catch (err) {
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

      totalCount = product.comments.length;
    }

    if (!comments) {
      return res.status(404).json({ message: "Comments not found" });
    }
    const commentsToReturn = [];

    await Promise.all(
      comments.map(async (comment) => {
        const user = await User.findById(comment.commenter).exec();
        if (!user) {
          return;
        }
        const commentToPush = {
          _id: comment._id,
          commenter: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            avatarUrl: user.avatarUrl,
          },
          commentText: comment.commentText,
          createdAt: comment.createdAt,
        };

        commentsToReturn.push(commentToPush);
      })
    );

    res.status(200).json({
      comments: commentsToReturn,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      totalComments: totalCount,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error", comments: [] });
  }
});

router.post("/buy", auth, async (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId || !quantity) {
    return res
      .status(400)
      .json({ message: "Please fill all the required fields!" });
  }

  const userId = req.data.user_id;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const total = product.price * quantity;

    const purchaseData = {
      userId: new ObjectId(userId),
      productId: new ObjectId(productId),
      quantity,
      total,
    };

    await Purchase.create(purchaseData);
    product.sold = true;
    await product.save();

    const buyer = await User.findById(userId);
    sendPurchasedMail(buyer.email, product.title, product.price, quantity);

    const seller = await User.findById(product.userId);
    sendSellerMail(
      seller.email,
      product.title,
      `${buyer.firstName} ${buyer.lastName}`
    );

    res.status(201).json({ message: "Purchase successful" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/purchased", auth, async (req, res) => {
  const userId = req.data.user_id;
  try {
    const purchases = await Purchase.find({
      userId: new ObjectId(userId),
    }).populate("productId");
    res.status(200).json(purchases);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

async function sendPurchasedMail(email, title, price, quantity) {
  try {
    const mailResponse = await mailSender(
      email,
      "Thank you for purchasing from Eco-TradeHub",
      `<h1>${title}</h1>
        <p>Thank you for purchasing from Eco-TradeHub. You are one step towards making a sustainable environment</p>
        <p>Please find your receipt below:</p>
        <p>Product: ${title}</p>
        <p>Price: Rs ${price}</p>
        <p>Quantity: ${quantity}</p>
        <p>Total: Rs ${price * quantity}</p>
        <p>Thank you for shopping with us!</p>

        <p>Regards,</p>
        <p>Eco-TradeHub Team</p>

        <p>This is an auto-generated email. Please do not reply to this email.</p>
      `
    );
    console.log("Email sent successfully: ", mailResponse);
  } catch (error) {
    console.log("Error occurred while sending email: ", error);
    throw error;
  }
}

async function sendSellerMail(email, title, buyerName) {
  try {
    const mailResponse = await mailSender(
      email,
      `Product ${title} Sold`,
      `<p>Your product ${title} was purchased by ${buyerName}. You are one step towards making a sustainable environment</p>
       
        <p>Regards,</p>
        <p>Eco-TradeHub Team</p>

        <p>This is an auto-generated email. Please do not reply to this email.</p>
      `
    );
    console.log("Email sent successfully: ", mailResponse);
  } catch (error) {
    console.log("Error occurred while sending email: ", error);
    throw error;
  }
}

module.exports = router;
