const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");
const auth = require("../middlewares/auth");

function isEmail(s) {
  return typeof s === "string" && s.includes("@") && s.length <= 254;
}

router.post("/register", async (req, res, next) => {
  try {
    const { email, password, pseudo, city, bio } = req.body;

    if (!isEmail(email)) return res.status(400).json({ error: "Invalid email" });
    if (typeof password !== "string" || password.length < 6)
      return res.status(400).json({ error: "Password too short (min 6)" });
    if (typeof pseudo !== "string" || pseudo.trim().length < 2)
      return res.status(400).json({ error: "Invalid pseudo" });
    if (typeof city !== "string" || city.trim().length < 2)
      return res.status(400).json({ error: "Invalid city" });
    if (bio != null && (typeof bio !== "string" || bio.length > 300))
      return res.status(400).json({ error: "Invalid bio" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already used" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashed, pseudo: pseudo.trim(), city: city.trim(), bio: bio ?? null },
      select: { id: true, email: true, pseudo: true, city: true, bio: true, createdAt: true }
    });

    res.status(201).json(user);
  } catch (e) {
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!isEmail(email)) return res.status(400).json({ error: "Invalid email" });
    if (typeof password !== "string") return res.status(400).json({ error: "Invalid password" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Bad credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Bad credentials" });

    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: { id: user.id, email: user.email, pseudo: user.pseudo, city: user.city, bio: user.bio }
    });
  } catch (e) {
    next(e);
  }
});

router.get("/me", auth, async (req, res, next) => {
  try {
    const me = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, pseudo: true, city: true, bio: true, createdAt: true }
    });
    res.json(me);
  } catch (e) {
    next(e);
  }
});

module.exports = router;