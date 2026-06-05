import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../api/axios";
import { useAuth } from "../auth/useAuth";
import { CATEGORY_OPTIONS } from "../constants/categories";

function normalizeCity(value) {
  const clean = String(value || "").trimStart().toLowerCase();
  if (!clean) return "";
  return clean
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function CreateAd() {
  const navigate = useNavigate();
  const { setToken } = useAuth();

  const [form, setForm] = useState({
    type: "OFFER",
    title: "",
    description: "",
    category: CATEGORY_OPTIONS[0],
    city: "",
    availability: "",
    pricingType: "FREE",
    price: "",
    modality: "REMOTE",
  });

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  function set(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const payload = {
        ...form,
        price: form.pricingType === "FREE" ? null : Number(form.price),
      };

      const res = await api.post("/ads", payload);
      navigate(`/ads/${res.data.id}`);
    } catch (e) {
      const status = e.response?.status;
      if (status === 401) {
        setToken(null);
        navigate("/login");
        return;
      }
      if (status === 403) {
        setErr("Action interdite (403).");
        return;
      }
      setErr(e.response?.data?.error || "Erreur création annonce");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #ddd",
    background: "white",
  };

  const labelStyle = { fontWeight: 800, fontSize: 13, marginBottom: 6 };

  return (
    <Layout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ marginTop: 0 }}>Nouvelle annonce</h2>
      </div>

      <div style={{ background: "white", border: "1px solid #eee", borderRadius: 16, padding: 16, maxWidth: 720 }}>
        {err && (
          <div style={{ background: "#ffecec", border: "1px solid #ffb3b3", padding: 12, borderRadius: 12, marginBottom: 12 }}>
            {err}
          </div>
        )}

        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={labelStyle}>Type</div>
              <select value={form.type} onChange={(e) => set("type", e.target.value)} style={inputStyle}>
                <option value="OFFER">Offre</option>
                <option value="REQUEST">Demande</option>
              </select>
            </div>

            <div>
              <div style={labelStyle}>Modalité</div>
              <select value={form.modality} onChange={(e) => set("modality", e.target.value)} style={inputStyle}>
                <option value="REMOTE">À distance</option>
                <option value="AT_PROVIDER">Chez le prestataire</option>
                <option value="AT_CUSTOMER">Chez le client</option>
              </select>
            </div>
          </div>

          <div>
            <div style={labelStyle}>Titre</div>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex: Cours de maths" style={inputStyle} />
          </div>

          <div>
            <div style={labelStyle}>Description</div>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Décris ton service / ta demande (min 10 caractères)"
              rows={5}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={labelStyle}>Catégorie</div>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                style={inputStyle}
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={labelStyle}>Ville</div>
              <input
                value={form.city}
                onChange={(e) => set("city", normalizeCity(e.target.value))}
                placeholder="Ex: Paris"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={labelStyle}>Tarification</div>
              <select value={form.pricingType} onChange={(e) => set("pricingType", e.target.value)} style={inputStyle}>
                <option value="FREE">Gratuit</option>
                <option value="HOURLY">Horaire</option>
                <option value="FIXED">Forfait</option>
              </select>
            </div>

            <div>
              <div style={labelStyle}>Prix</div>
              <input
                type="number"
                disabled={form.pricingType === "FREE"}
                value={form.pricingType === "FREE" ? "" : form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder={form.pricingType === "FREE" ? "—" : "Ex: 20"}
                style={{ ...inputStyle, background: form.pricingType === "FREE" ? "#f6f6f6" : "white" }}
              />
              <div style={{ color: "#666", fontSize: 12, marginTop: 6 }}>
                {form.pricingType === "HOURLY" ? "€ / heure" : form.pricingType === "FIXED" ? "€ (forfait)" : "Gratuit"}
              </div>
            </div>
          </div>

          <div>
            <div style={labelStyle}>Disponibilités (optionnel)</div>
            <input value={form.availability} onChange={(e) => set("availability", e.target.value)} placeholder="Ex: Lun-Ven 18h-20h" style={inputStyle} />
          </div>

          <button
            disabled={loading}
            style={{
              marginTop: 4,
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid #111",
              background: "#111",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Création…" : "Créer l'annonce"}
          </button>
        </form>
      </div>
    </Layout>
  );
}
