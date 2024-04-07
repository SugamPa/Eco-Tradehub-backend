const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.status(403).json({ message: "Unauthorized" });

  jwt.verify(token, "sugam123", (err, data) => {
    if (err) return res.status(403).json({ message: "Unauthorized" });
    req.data = data;
    next();
  });
}

module.exports = authenticateToken;
