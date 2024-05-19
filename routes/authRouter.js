const router = require("express").Router();
const user = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");

function generateAccessToken(data) {
  return jwt.sign(data, "sugam123");
}

router.post("/register", (req, res) => {
  // Validation
  if (
    !req.body.name ||
    !req.body.email ||
    !req.body.phoneNumber ||
    !req.body.password ||
    !req.body.otp
  ) {
    res.status(400).json({ message: "Please fill out all fields" });
  } else {
    // Check if user already exists
    user.findOne({ email: req.body.email }, async (err, data) => {
      if (err) {
        res.status(500).send(err);
      } else if (data) {
        res.status(400).json({ message: "Email address already in use" });
      } else {
        const response = await OTP.find({ email: req.body.email })
          .sort({ createdAt: -1 })
          .limit(1);
        console.log(response);
        if (response.length === 0) {
          // OTP not found for the email
          return res.status(400).json({
            success: false,
            message: "The OTP is not valid",
          });
        } else if (req.body.otp !== response[0].otp) {
          // Invalid OTP
          return res.status(400).json({
            success: false,
            message: "The OTP is not valid",
          });
        }

        // Create new user
        hashedPassword = bcrypt.hashSync(req.body.password, 10);
        const newUser = new user({
          name: req.body.name,
          email: req.body.email,
          phoneNumber: req.body.phoneNumber,
          password: hashedPassword,
          avatarUrl: req.body.avatarUrl,
        });
        newUser.save((err, data) => {
          if (err) {
            res.status(500).send(err);
          } else {
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

          const { password, ...user } = data._doc;
          res.status(200).json({
            message: "Login successful",
            user,
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

router.post("/sendOTP", async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user is already present
    // Find user with provided email
    const checkUserPresent = await user.findOne({ email });
    // to be used in case of signup

    // If user found with provided email
    if (checkUserPresent) {
      // Return 401 Unauthorized status code with error message
      return res.status(401).json({
        success: false,
        message: `User is Already Registered`,
      });
    }

    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    const result = await OTP.findOne({ otp: otp });
    console.log("Result is Generate OTP Func");
    console.log("OTP", otp);
    console.log("Result", result);
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
      });
    }
    const otpPayload = { email, otp };
    const otpBody = await OTP.create(otpPayload);
    console.log("OTP Body", otpBody);
    res.status(200).json({
      success: true,
      message: `OTP Sent Successfully`,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
