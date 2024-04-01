const router = require("express").Router();
const user = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

function generateAccessToken(data) {
  return jwt.sign(data, "sugam123", { expiresIn: "30m" });
}

router.post("/register", (req, res) => {
  // Validation
  if (!req.body.name || !req.body.email || !req.body.password) {
    res.status(400).json({ message: "Please fill out all fields" });
  } else {
    // Check if user already exists
    user.findOne({ email: req.body.email }, (err, data) => {
      if (err) {
        res.status(500).send(err);
      } else if (data) {
        res.status(400).json({ message: "Email address already in use" });
      } else {
        // Create new user
        hashedPassword = bcrypt.hashSync(req.body.password, 10);
        const newUser = new user({
          name: req.body.name,
          email: req.body.email,
          password: hashedPassword,
        });
        newUser.save((err, data) => {
          if (err) {
            console.log(err);
            res.status(500).send(err);
          } else {
            console.log(data);
            res.status(200).json({ message: "Registered successfully" });
          }
        });
      }
    });
  }
});

router.post("/login", (req, res) => {
  // Validation
  if (!req.body.email || !req.body.password) {
    res.status(400).json({ message: "Please fill out all fields" });
  } else {
    // Check if user exists
    user.findOne({ email: req.body.email }, (err, data) => {
      if (err) {
        res.status(500).send(err);
      } else if (!data) {
        res.status(404).json({ message: "Email address not found" });
      } else {
        // Check if password is correct
        if (bcrypt.compareSync(req.body.password, data.password)) {
          const access_token = generateAccessToken({ user_id: data["_id"] });
          const refresh_token = jwt.sign({ user_id: data["_id"] }, "sugam123");
          res.status(200).json({
            message: "Login successful",
            access_token: access_token,
            refresh_token: refresh_token,
          });
        } else {
          res.status(401).json({ message: "Incorrect password" });
        }
      }
    });
  }
});

router.post("/regenerateToken", (req, res) => {
  const refresh_token = req.body.refresh_token;
  if (refresh_token == null) return res.sendStatus(401);
  jwt.verify(refresh_token, "sugam123", (err, data) => {
    if (err) return res.sendStatus(403);
    const access_token = generateAccessToken({ user_id: data.user_id });
    res.json({ access_token: access_token });
  });
});

module.exports = router;
