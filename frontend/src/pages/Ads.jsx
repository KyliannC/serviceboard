import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";
import { useAuth } from "../auth/useAuth";
import { useNavigate } from "react-router-dom";
import { formatCity } from "../utils/city";

function normalizeCity(value) {
  const clean = String(value || "").trimStart().toLowerCase();
  if (!clean) return "";
  return clean
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function Card({ ad, onOpen }) {
  return (
    <button
      onClick={() => onOpen(ad.id)}
      style={{
        textAlign: "left",
        border: "1px solid #eee",
        background: "white",
        borderRadius: 16,
        padding: 14,
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 16 }}>{ad.title}</div>
          <div style={{ color: "#666", marginTop: 4 }}>
            {ad.category} · {formatCity(ad.city)} · {ad.modality}
          </div>
        </div>
        <div style={{ fontWeight: 900 }}>
          {ad.pricingType === "FREE" ? "Gratuit" : `${ad.price}€`}
        </div>
      </div>

      <div style={{ marginTop: 10, color: "#333" }}>
        {(ad.description || "").slice(0, 110)}
        {(ad.description || "").length > 110 ? "…" : ""}
      </div>

      <div style={{ marginTop: 10, color: "#777", fontSize: 13 }}>
        Par {ad.author?.pseudo || "?"}
      </div>
    </button>
  );
}

export default function Ads() {
  const { isLogged } = useAuth();
  const navigate = useNavigate();

  function openAd(id) {
    navigate(`/ads/${id}`);
  }

  // UI state
  const [tab, setTab] = useState("OFFER"); // OFFER | REQUEST
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("recent"); // recent | price_asc | price_desc

  // data
  const [ads, setAds] = useState([]);
  const [me, setMe] = useState(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const params = useMemo(() => {
    const p = { type: tab };
    if (q.trim()) p.q = q.trim();
    if (city.trim()) p.city = city.trim();
    if (category.trim()) p.category = category.trim();
    if (sort) p.sort = sort;
    return p;
  }, [tab, q, city, category, sort]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr("");

      try {
        const res = await api.get("/ads", { params });
        setAds(res.data);

        if (isLogged) {
          try {
            const meRes = await api.get("/auth/me");
            setMe(meRes.data);
          } catch {
            setMe(null);
          }
        } else {
          setMe(null);
        }

      } catch (e) {
        setErr(e.response?.data?.error || "Erreur chargement annonces");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params, isLogged]);

  function resetFilters() {
    setQ("");
    setCity("");
    setCategory("");
    setSort("recent");
  }

  // ✅ Ne pas afficher mes annonces dans la liste publique
  const filtered = me ? ads.filter((a) => a.author?.id !== me.id) : ads;

  return (
    <Layout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ marginTop: 0, marginBottom: 10 }}>Annonces</h2>

        {isLogged && (
          <button
            onClick={() => navigate("/ads/new")}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #111",
              background: "#111",
              color: "white",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            + Nouvelle annonce
          </button>
        )}
      </div>

      {/* Tabs OFFER/REQUEST */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setTab("OFFER")}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #ddd",
            background: tab === "OFFER" ? "#111" : "white",
            color: tab === "OFFER" ? "white" : "#111",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Offres
        </button>
        <button
          onClick={() => setTab("REQUEST")}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #ddd",
            background: tab === "REQUEST" ? "#111" : "white",
            color: tab === "REQUEST" ? "white" : "#111",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Demandes
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <input
          placeholder="Rechercher (titre/description)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
        />
        <input
          placeholder="Ville"
          value={city}
          onChange={(e) => setCity(normalizeCity(e.target.value))}
          style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
        />
        <input
          placeholder="Catégorie"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd", background: "white" }}
        >
          <option value="recent">Plus récent</option>
          <option value="price_asc">Prix croissant</option>
          <option value="price_desc">Prix décroissant</option>
        </select>

        <button
          onClick={resetFilters}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #ddd",
            background: "white",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Reset
        </button>
      </div>

      {err && (
        <div style={{ background: "#ffecec", border: "1px solid #ffb3b3", padding: 12, borderRadius: 12, marginBottom: 12 }}>
          {err}
        </div>
      )}

      {loading ? (
        <p>Chargement…</p>
      ) : filtered.length === 0 ? (
        <div style={{ background: "white", border: "1px solid #eee", padding: 16, borderRadius: 16 }}>
          Aucune annonce trouvée.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
          {filtered.map((ad) => (
            <Card key={ad.id} ad={ad} onOpen={openAd} />
          ))}
        </div>
      )}
    </Layout>
  );
}
