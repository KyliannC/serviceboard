const prisma = require("../prisma");

module.exports = async function requireAdOwner(req, res, next) {
  try {
    const adId = Number(req.params.id);
    if (!Number.isInteger(adId)) return res.status(400).json({ error: "Invalid ad id" });

    const ad = await prisma.ad.findUnique({ where: { id: adId } });
    if (!ad) return res.status(404).json({ error: "Ad not found" });

    if (ad.authorId !== req.user.id) return res.status(403).json({ error: "Forbidden" });

    req.ad = ad;
    next();
  } catch (e) {
    next(e);
  }
};