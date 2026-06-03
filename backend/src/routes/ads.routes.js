const router = require("express").Router();
const prisma = require("../prisma");
const auth = require("../middlewares/auth");
const requireAdOwner = require("../middlewares/requireAdOwner");
const authOptional = require("../middlewares/authOptional");

const VALID_TYPES = ["OFFER", "REQUEST"];
const VALID_PRICING_TYPES = ["FREE", "HOURLY", "FIXED"];
const VALID_MODALITIES = ["ONSITE", "ONLINE", "HYBRID"];
const VALID_CATEGORIES = [
  "Education",
  "Informatique",
  "Langues",
  "Design",
  "Marketing",
  "Business",
  "Musique",
  "Sport",
  "Maison",
  "Autre",
];

function normalizeCity(city) {
  const clean = String(city || "").trim().toLowerCase();
  if (!clean) return "";
  return clean
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function asTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

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
    await prisma.$transaction(async (tx) => {
      const conversations = await tx.conversation.findMany({
        where: { adId: req.ad.id },
        select: { id: true },
      });
      const conversationIds = conversations.map((conversation) => conversation.id);

      if (conversationIds.length > 0) {
        await tx.message.deleteMany({
          where: { conversationId: { in: conversationIds } },
        });
      }

      await tx.conversation.deleteMany({ where: { adId: req.ad.id } });
      await tx.ad.delete({ where: { id: req.ad.id } });
    });

    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", auth, requireAdOwner, async (req, res, next) => {
  try {
    const data = {};
    const allowedFields = [
      "type",
      "title",
      "description",
      "category",
      "city",
      "availability",
      "pricingType",
      "price",
      "modality",
    ];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    }

    // empêcher modification du propriétaire
    delete data.authorId;
    delete data.status;

    // ✅ availability: jamais null (dans ton schema c'est NOT NULL)
    if (data.availability === null) {
      return res.status(400).json({ error: "availability must not be null" });
    }
    if (typeof data.availability === "string") {
      data.availability = data.availability.trim();
    }

    if (data.type !== undefined) {
      if (!VALID_TYPES.includes(String(data.type))) {
        return res.status(400).json({ error: "Invalid type" });
      }
      data.type = String(data.type);
    }

    if (data.title !== undefined) {
      const normalizedTitle = asTrimmedString(data.title);
      if (normalizedTitle.length < 1) {
        return res.status(400).json({ error: "Invalid title" });
      }
      data.title = normalizedTitle;
    }

    if (data.description !== undefined) {
      const normalizedDescription = asTrimmedString(data.description);
      if (normalizedDescription.length < 10) {
        return res.status(400).json({ error: "Invalid description" });
      }
      data.description = normalizedDescription;
    }

    if (data.category !== undefined) {
      const normalizedCategory = asTrimmedString(data.category);
      if (!VALID_CATEGORIES.includes(normalizedCategory)) {
        return res.status(400).json({ error: "Invalid category" });
      }
      data.category = normalizedCategory;
    }

    if (data.modality !== undefined) {
      if (!VALID_MODALITIES.includes(String(data.modality))) {
        return res.status(400).json({ error: "Invalid modality" });
      }
      data.modality = String(data.modality);
    }

    if (typeof data.city === "string") {
      const normalizedCity = normalizeCity(data.city);
      if (normalizedCity.length < 2) {
        return res.status(400).json({ error: "Invalid city" });
      }
      data.city = normalizedCity;
    }

    // ✅ pricingType validation
    if (data.pricingType !== undefined) {
      if (!VALID_PRICING_TYPES.includes(String(data.pricingType))) {
        return res.status(400).json({ error: "Invalid pricingType" });
      }
      data.pricingType = String(data.pricingType);
    }

    // ✅ conversion price si présent (ou forcé par FREE)
    if (data.price !== undefined) {
      if (data.price === null) {
        // ok
      } else {
        const p = Number(data.price);
        if (!Number.isFinite(p)) {
          return res.status(400).json({ error: "Invalid price" });
        }
        data.price = p;
      }
    }

    // ✅ cohérence pricingType/price APRÈS update
    // On calcule le "next state" en combinant ce qui existe déjà (req.ad) + ce qu'on update
    const nextPricingType = data.pricingType ?? req.ad.pricingType;
    const nextPrice = data.price ?? req.ad.price;

    if (nextPricingType === "FREE") {
      data.price = null;
    } else {
      if (nextPrice === null || nextPrice === undefined) {
        return res.status(400).json({ error: "Price required" });
      }
      if (!Number.isFinite(Number(nextPrice)) || Number(nextPrice) <= 0) {
        return res.status(400).json({ error: "Price must be > 0" });
      }
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
    if (!VALID_TYPES.includes(type))
      return res.status(400).json({ error: "Invalid type" });

    const normalizedTitle = asTrimmedString(title);
    if (normalizedTitle.length < 1)
      return res.status(400).json({ error: "Invalid title" });

    const normalizedDescription = asTrimmedString(description);
    if (normalizedDescription.length < 10)
      return res.status(400).json({ error: "Invalid description" });

    const normalizedCategory = asTrimmedString(category);
    if (!VALID_CATEGORIES.includes(normalizedCategory))
      return res.status(400).json({ error: "Invalid category" });

    if (!VALID_MODALITIES.includes(String(modality)))
      return res.status(400).json({ error: "Invalid modality" });

    const normalizedCity = normalizeCity(city);
    if (normalizedCity.length < 2)
      return res.status(400).json({ error: "Invalid city" });

    if (!VALID_PRICING_TYPES.includes(pricingType))
      return res.status(400).json({ error: "Invalid pricingType" });

    if ((pricingType === "HOURLY" || pricingType === "FIXED") && (!Number.isFinite(Number(price)) || Number(price) <= 0))
      return res.status(400).json({ error: "Price required and must be > 0" });

    const ad = await prisma.ad.create({
      data: {
        authorId: req.user.id,
        type,
        title: normalizedTitle,
        description: normalizedDescription,
        category: normalizedCategory,
        city: normalizedCity,
        availability: typeof availability === "string" ? availability.trim() : "",
        pricingType,
        price: pricingType === "FREE" ? null : Number(price),
        modality: String(modality),
        status: "DRAFT"
      }
    });

    res.status(201).json(ad);

  } catch (err) {
    next(err);
  }
});



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

router.get("/mine", auth, async (req, res, next) => {
  try {
    const ads = await prisma.ad.findMany({
      where: { authorId: req.user.id },
      orderBy: { createdAt: "desc" },
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
        createdAt: true
      }
    });
    res.json(ads);
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { q, type, category, city, sort } = req.query;

    const where = {
        status: "PUBLISHED",
      };

      if (type) where.type = String(type);

      // BONUS: case-insensitive aussi sur city/category
      if (category) where.category = String(category);
      if (city) where.city = normalizeCity(String(city));

      if (q) {
        where.OR = [
          { title: { contains: String(q), mode: "insensitive" } },
          { description: { contains: String(q), mode: "insensitive" } },
        ];
      }

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

module.exports = router;
