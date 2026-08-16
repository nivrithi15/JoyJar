const jwt = require("jsonwebtoken");
const { findUserById } = require("../utils/inMemoryStore");

/** Require a valid `Authorization: Bearer <token>` header. */
const protect = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || "";
    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Authentication token is required." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = findUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "The user for this token no longer exists." });
    }

    // Never expose the password hash to later middleware or API responses.
    req.user = { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired authentication token." });
  }
};

module.exports = { protect };
