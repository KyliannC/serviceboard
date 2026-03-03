const router = require("express").Router();
const prisma = require("../prisma");
const auth = require("../middlewares/auth");
const requireAdOwner = require("../middlewares/requireAdOwner");
const authOptional = require("../middlewares/authOptional");

router.post("/:id/unpublish", auth, requireAdOwner, async (req, res, next) => {
  try {
    const updated = await prisma.ad.update({
      where: { id: req.ad.id },
      data: { status: "DRAFT" }
    });

    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", auth, requireAdOwner, async (req, res, next) => {
  try {
    await prisma.ad.delete({ where: { id: req.ad.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", auth, requireAdOwner, async (req, res, next) => {
  try {
    const data = { ...req.body };

    // empêcher modification du propriétaire
    delete data.authorId;

    if (data.price !== undefined) {
      data.price = data.price === null ? null : Number(data.price);
    }

    const updated = await prisma.ad.update({
      where: { id: req.ad.id },
      data
    });

    res.json(updated);

  } catch (e) {
    next(e);
  }
});

router.post("/", auth, async (req, res, next) => {
  try {
    const {
      type,
      title,
      description,
      category,
      city,
      availability,
      pricingType,
      price,
      modality
    } = req.body;

    // 🔎 Validation simple
    if (!["OFFER", "REQUEST"].includes(type))
      return res.status(400).json({ error: "Invalid type" });

    if (!title || title.length < 3)
      return res.status(400).json({ error: "Invalid title" });

    if (!description || description.length < 10)
      return res.status(400).json({ error: "Invalid description" });

    if (!["FREE", "HOURLY", "FIXED"].includes(pricingType))
      return res.status(400).json({ error: "Invalid pricingType" });

    if ((pricingType === "HOURLY" || pricingType === "FIXED") && (!price || price <= 0))
      return res.status(400).json({ error: "Price required and must be > 0" });

    const ad = await prisma.ad.create({
      data: {
        authorId: req.user.id,
        type,
        title,
        description,
        category,
        city,
        availability,
        pricingType,
        price: pricingType === "FREE" ? null : Number(price),
        modality,
        status: "DRAFT"
      }
    });

    res.status(201).json(ad);

  } catch (err) {
    next(err);
  }
});

module.exports = router;

router.post("/:id/publish", auth, requireAdOwner, async (req, res, next) => {
  try {
    const updated = await prisma.ad.update({
      where: { id: req.ad.id },
      data: { status: "PUBLISHED" }
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { q, type, category, city, sort } = req.query;

    const where = {
      status: "PUBLISHED",
      ...(type ? { type: String(type) } : {}),
      ...(category ? { category: String(category) } : {}),
      ...(city ? { city: String(city) } : {}),
      ...(q
        ? {
            OR: [
                { title: { contains: String(q) } },
                { description: { contains: String(q) } }
            ]
            }
        : {})
    };

    // tri
    let orderBy = { createdAt: "desc" }; 
    if (sort === "price_asc") orderBy = [{ price: "asc" }, { createdAt: "desc" }];
    if (sort === "price_desc") orderBy = [{ price: "desc" }, { createdAt: "desc" }];
    if (sort === "recent") orderBy = { createdAt: "desc" };

    const ads = await prisma.ad.findMany({
      where,
      orderBy,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        category: true,
        city: true,
        availability: true,
        pricingType: true,
        price: true,
        modality: true,
        status: true,
        createdAt: true,
        author: { select: { id: true, pseudo: true, city: true } }
      }
    });

    res.json(ads);
  } catch (e) {
    next(e);
  }
});

router.get("/:id", authOptional, async (req, res, next) => {
  try {
    const adId = Number(req.params.id);
    if (!Number.isInteger(adId)) return res.status(400).json({ error: "Invalid ad id" });

    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      include: {
        author: { select: { id: true, pseudo: true, city: true, bio: true } }
      }
    });

    if (!ad) return res.status(404).json({ error: "Ad not found" });

    // si DRAFT : seulement l'auteur peut voir
    if (ad.status !== "PUBLISHED") {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      if (req.user.id !== ad.authorId) return res.status(403).json({ error: "Forbidden" });
    }

    res.json(ad);
  } catch (e) {
    next(e);
  }
});

