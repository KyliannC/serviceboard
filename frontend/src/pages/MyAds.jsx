import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { formatCity } from "../utils/city";

export default function MyAds() {
  const [ads, setAds] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get("/ads/mine");
        setAds(res.data);
      } catch (e) {
        setErr(e.response?.data?.error || "Erreur chargement mes annonces");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <Layout>
      <h2 style={{ marginTop: 0 }}>Mes annonces</h2>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      {loading ? (
        <p>Chargement…</p>
      ) : ads.length === 0 ? (
        <p>Aucune annonce.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          {ads.map((ad) => (
            <button
              key={ad.id}
              onClick={() => navigate(`/ads/${ad.id}`)}
              style={{
                textAlign: "left",
                border: "1px solid #eee",
                background: "white",
                borderRadius: 16,
                padding: 14,
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ fontWeight: 900 }}>{ad.title}</div>
                <div style={{
                  fontWeight: 900,
                  color: ad.status === "PUBLISHED" ? "green" : "#d97706"
                }}>
                  {ad.status}
                </div>
              </div>
              <div style={{ color: "#666", marginTop: 4 }}>
                {ad.type} · {ad.category} · {formatCity(ad.city)}
              </div>
              <div style={{ marginTop: 8, color: "#333" }}>
                {(ad.description || "").slice(0, 90)}
                {(ad.description || "").length > 90 ? "…" : ""}
              </div>
            </button>
          ))}
        </div>
      )}
    </Layout>
  );
}
