const assert = require("node:assert/strict");
const test = require("node:test");

const {
  VALID_MODALITIES,
  normalizeCity,
  buildPublishedAdsWhere,
  buildAdsOrderBy,
} = require("../src/utils/validateAdInput");

test("modalities match the project requirements", () => {
  assert.deepEqual(VALID_MODALITIES, [
    "REMOTE",
    "AT_PROVIDER",
    "AT_CUSTOMER",
  ]);
});

test("normalizeCity trims and title-cases city names", () => {
  assert.equal(normalizeCity("  pARis  "), "Paris");
  assert.equal(normalizeCity("saint   etienne"), "Saint Etienne");
  assert.equal(normalizeCity(""), "");
});

test("buildPublishedAdsWhere builds listing filters", () => {
  assert.deepEqual(
    buildPublishedAdsWhere({
      q: "maths",
      type: "OFFER",
      category: "Education",
      city: "lyon",
    }),
    {
      status: "PUBLISHED",
      type: "OFFER",
      category: "Education",
      city: "Lyon",
      OR: [
        { title: { contains: "maths" } },
        { description: { contains: "maths" } },
      ],
    }
  );
});

test("buildPublishedAdsWhere skips empty search terms", () => {
  assert.deepEqual(buildPublishedAdsWhere({ q: "   " }), {
    status: "PUBLISHED",
  });
});

test("buildAdsOrderBy supports recent and price sorts", () => {
  assert.deepEqual(buildAdsOrderBy("recent"), { createdAt: "desc" });
  assert.deepEqual(buildAdsOrderBy("price_asc"), [
    { price: "asc" },
    { createdAt: "desc" },
  ]);
  assert.deepEqual(buildAdsOrderBy("price_desc"), [
    { price: "desc" },
    { createdAt: "desc" },
  ]);
});
