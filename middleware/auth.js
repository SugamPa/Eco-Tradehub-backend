const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, "sugam123", (err, data) => {
    if (err) return res.sendStatus(403);
    req.data = data;
    next();
  });
}

module.exports = authenticateToken;
