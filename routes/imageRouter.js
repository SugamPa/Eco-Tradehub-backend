const router = require("express").Router();

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dinksfmuj",
  api_key: "428558313954977",
  api_secret: "PZNw02JQ3xEnf2x1rLkjOFqmcHI",
});

const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/upload", upload.array("images", 5), async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).json({ message: "Please upload images" });
    }

    const imageUrls = [];

    for (let i = 0; i < req.files.length; i++) {
      cloudinary.uploader
        .upload_stream({ resource_type: "image" }, async (error, result) => {
          if (error) {
            return res.status(500).json({ message: error.message });
          }

          imageUrls.push(result.secure_url);

          if (imageUrls.length === req.files.length) {
            res.status(200).json({ imageUrls });
          }
        })
        .end(req.files[i].buffer);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
