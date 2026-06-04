const VALID_TYPES = ["OFFER", "REQUEST"];
const VALID_PRICING_TYPES = ["FREE", "HOURLY", "FIXED"];
const VALID_MODALITIES = ["REMOTE", "AT_PROVIDER", "AT_CUSTOMER"];
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

function buildPublishedAdsWhere(query = {}) {
  const { q, type, category, city } = query;
  const where = { status: "PUBLISHED" };

  if (type) where.type = String(type);
  if (category) where.category = String(category);
  if (city) where.city = normalizeCity(String(city));

  if (q) {
    const keyword = String(q).trim();
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }
  }

  return where;
}

function buildAdsOrderBy(sort) {
  if (sort === "price_asc") return [{ price: "asc" }, { createdAt: "desc" }];
  if (sort === "price_desc") return [{ price: "desc" }, { createdAt: "desc" }];
  return { createdAt: "desc" };
}

module.exports = {
  VALID_TYPES,
  VALID_PRICING_TYPES,
  VALID_MODALITIES,
  VALID_CATEGORIES,
  normalizeCity,
  asTrimmedString,
  buildPublishedAdsWhere,
  buildAdsOrderBy,
};
