const jwt = require("jsonwebtoken");

module.exports = function authOptional(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return next();

  const token = h.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: Number(payload.sub) };
  } catch {
    // token invalide -> on ignore (route reste accessible)
  }
  next();
};