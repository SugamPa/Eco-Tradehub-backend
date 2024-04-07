const router = require("express").Router();
const User = require("../models/user");

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

  const body = {};

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

module.exports = router;
