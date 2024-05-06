const router = require("express").Router();
const User = require("../models/user");
const Product = require("../models/product");

router.get("/getUserData", async (req, res) => {
  const { user_id } = req.data;
  try {
    const user = await User.findById(user_id);
    res.json({
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      playlists: user.playlists,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id/products", async (req, res) => {
  const { id } = req.params;
  try {
    const products = await Product.find({ userId: id }).populate({
      path: "userId",
      select: "name email phoneNumber avatarUrl",
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/deleteUser", async (req, res) => {
  const { user_id } = req.data;
  try {
    await User.findByIdAndDelete(user_id);
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/updateProfile", async (req, res) => {
  const { user_id } = req.data;

  if (req.body.name) body.name = req.body.name;
  if (req.body.email) body.email = req.body.email;
  if (req.body.phoneNumber) body.phoneNumber = req.body.phoneNumber;
  if (req.body.dateOfBirth) body.dateOfBirth = req.body.dateOfBirth;
  if (req.body.avatarUrl) body.avatarUrl = req.body.avatarUrl;

  try {
    const user = await User.findByIdAndUpdate(user_id, body);
    res.json({ message: "Profile updated", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/isFavorite", async (req, res) => {
  const { user_id } = req.data;
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ error: "Product ID is required" });
  }

  try {
    const user = await User.findById(user_id);
    const isFavorite = user.favorites.includes(productId);
    res.json({ isFavorite });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/getFavorites", async (req, res) => {
  const { user_id } = req.data;
  try {
    const user = await User.findById(user_id);

    const products = await Product.find({
      _id: { $in: user.favorites },
    }).populate({
      path: "userId",
      select: "name email avatarUrl",
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/toggleFavorites", async (req, res) => {
  const { user_id } = req.data;
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ error: "Product ID is required" });
  }

  try {
    const user = await User.findById(user_id);
    if (user.favorites.includes(productId)) {
      user.favorites.pull(productId);
    } else {
      user.favorites.push(productId);
    }
    await user.save();
    res.json({ isFavorite: user.favorites.includes(productId) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;
