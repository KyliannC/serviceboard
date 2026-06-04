import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../api/axios";
import { useAuth } from "../auth/useAuth";

function normalizeCity(value) {
  const clean = String(value || "").trimStart().toLowerCase();
  if (!clean) return "";
  return clean
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function AdDetails() {
  const { id } = useParams();
  const adId = Number(id);
  const navigate = useNavigate();
  const { isLogged } = useAuth();

  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionErr, setActionErr] = useState("");

  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [message, setMessage] = useState("Bonjour, je suis intéressé !");
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState("");

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    city: "",
    availability: "",
    modality: "",
    pricingType: "",
    price: "",
  });
  const [editErr, setEditErr] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const ownerId = ad?.author?.id ?? ad?.authorId;
  const isOwner = !!me && Number(me.id) === Number(ownerId);

  function toAdErrorMessage(e, fallback = "Erreur chargement annonce") {
    const status = e.response?.status;
    if (status === 404) return "Annonce introuvable (404).";
    if (status === 403) return "Accès interdit à cette annonce (403).";
    return e.response?.data?.error || fallback;
  }

  function toActionErrorMessage(e, fallback) {
    const status = e.response?.status;
    if (status === 404) return "Annonce introuvable (404).";
    if (status === 403) return "Action interdite (403).";
    return e.response?.data?.error || fallback;
  }

  function mergeAdUpdate(nextAd) {
    setAd((prev) => ({
      ...(prev || {}),
      ...(nextAd || {}),
      author: nextAd?.author || prev?.author || null,
    }));
  }

  // charge "me"
  useEffect(() => {
    async function loadMe() {
      if (!isLogged) {
        setMe(null);
        return;
      }
      setMeLoading(true);
      try {
        const meRes = await api.get("/auth/me");
        setMe(meRes.data);
      } catch {
        setMe(null);
      } finally {
        setMeLoading(false);
      }
    }
    loadMe();
  }, [isLogged]);

  // charge l'annonce
  useEffect(() => {
    async function loadAd() {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get(`/ads/${adId}`);
        setAd(res.data);
      } catch (e) {
        setErr(toAdErrorMessage(e));
      } finally {
        setLoading(false);
      }
    }

    if (!Number.isInteger(adId)) {
      setErr("ID invalide");
      setLoading(false);
      return;
    }

    loadAd();
  }, [adId]);

  // pré-remplir form d'edit
  useEffect(() => {
    if (!ad) return;
    setEditForm({
      title: ad.title || "",
      description: ad.description || "",
      category: ad.category || "",
      city: ad.city || "",
      availability: ad.availability || "",
      modality: ad.modality || "REMOTE",
      pricingType: ad.pricingType || "FREE",
      price: ad.price ?? "",
    });
  }, [ad]);

  async function contact() {
    setSendErr("");
    if (!isLogged) {
      navigate("/login");
      return;
    }
    if (!message.trim()) {
      setSendErr("Message vide");
      return;
    }

    setSending(true);
    try {
      const res = await api.post(`/conversations/ads/${adId}/message`, {
        content: message.trim(),
      });
      navigate("/chat", { state: { conversationId: res.data.conversationId } });
    } catch (e) {
      setSendErr(e.response?.data?.error || "Erreur envoi message");
    } finally {
      setSending(false);
    }
  }

  async function publish() {
    setActionErr("");
    setActionLoading(true);
    try {
      const res = await api.post(`/ads/${adId}/publish`);
      mergeAdUpdate(res.data);
    } catch (e) {
      setActionErr(toActionErrorMessage(e, "Erreur publish"));
    } finally {
      setActionLoading(false);
    }
  }

  async function unpublish() {
    setActionErr("");
    setActionLoading(true);
    try {
      const res = await api.post(`/ads/${adId}/unpublish`);
      mergeAdUpdate(res.data);
    } catch (e) {
      setActionErr(toActionErrorMessage(e, "Erreur unpublish"));
    } finally {
      setActionLoading(false);
    }
  }

  function setField(name, value) {
    const normalizedValue = name === "city" ? normalizeCity(value) : value;
    setEditForm((f) => ({ ...f, [name]: normalizedValue }));
  }

  async function saveEdit() {
  setEditErr("");

  if (!editForm.title || editForm.title.trim().length < 3) {
    setEditErr("Titre invalide (min 3 caractères)");
    return;
  }
  if (!editForm.description || editForm.description.trim().length < 10) {
    setEditErr("Description invalide (min 10 caractères)");
    return;
  }

  // ✅ prix obligatoire si HOURLY/FIXED
  if (editForm.pricingType !== "FREE") {
    if (String(editForm.price).trim() === "") {
      setEditErr("Prix obligatoire si tarification horaire/forfait");
      return;
    }
    const p = Number(editForm.price);
    if (!Number.isFinite(p) || p <= 0) {
      setEditErr("Prix invalide (doit être un nombre > 0)");
      return;
    }
  }

  setEditLoading(true);

  try {
    const payload = {
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      category: editForm.category.trim(),
      city: editForm.city.trim(),
      availability: editForm.availability.trim(), // ✅ pas null
      modality: editForm.modality,
      pricingType: editForm.pricingType,
      price: editForm.pricingType === "FREE" ? null : Number(editForm.price),
    };

    const res = await api.patch(`/ads/${adId}`, payload);
    mergeAdUpdate(res.data);
    setEditing(false);
  } catch (e) {
    setEditErr(toActionErrorMessage(e, "Erreur modification annonce"));
  } finally {
    setEditLoading(false);
  }
}

  async function removeAd() {
    const ok = window.confirm("Supprimer cette annonce ? (irréversible)");
    if (!ok) return;

    setActionErr("");
    setActionLoading(true);
    try {
      await api.delete(`/ads/${adId}`);
      navigate("/my-ads");
    } catch (e) {
      setActionErr(toActionErrorMessage(e, "Erreur suppression annonce"));
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <Layout>
      <button
        onClick={() => navigate(-1)}
        style={{
          border: "1px solid #ddd",
          background: "white",
          borderRadius: 12,
          padding: "8px 10px",
          cursor: "pointer",
          marginBottom: 12,
          fontWeight: 700,
        }}
      >
        ← Retour
      </button>

      {loading ? (
        <p>Chargement…</p>
      ) : err ? (
        <div style={{ background: "#ffecec", border: "1px solid #ffb3b3", padding: 12, borderRadius: 12 }}>
          {err}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
          {/* Left */}
          <div style={{ background: "white", border: "1px solid #eee", borderRadius: 16, padding: 16 }}>
            <h2 style={{ marginTop: 0 }}>{ad.title}</h2>

            <div style={{ color: "#666", marginBottom: 10 }}>
              {ad.category} · {normalizeCity(ad.city)} · {ad.modality} · {ad.type}
            </div>

            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 12 }}>
              {ad.pricingType === "FREE" ? "Gratuit" : `${ad.price}€`}{" "}
              {ad.pricingType === "HOURLY" ? "/h" : ""}
            </div>

            <h3>Description</h3>
            <p style={{ whiteSpace: "pre-wrap" }}>{ad.description}</p>

            {ad.availability && (
              <>
                <h3>Disponibilités</h3>
                <p>{ad.availability}</p>
              </>
            )}
          </div>

          {/* Right */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Gestion : owner */}
            {isOwner && (
              <div style={{ background: "white", border: "1px solid #eee", borderRadius: 16, padding: 16 }}>
                <h3 style={{ marginTop: 0 }}>Gestion</h3>

                <p style={{ marginTop: 0, color: "#666" }}>
                  Statut : <b>{ad.status}</b>
                </p>

                {actionErr && <p style={{ color: "crimson" }}>{actionErr}</p>}

                {ad.status !== "PUBLISHED" ? (
                  <button
                    onClick={publish}
                    disabled={actionLoading}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid #111",
                      background: "#111",
                      color: "white",
                      fontWeight: 900,
                      cursor: "pointer",
                      opacity: actionLoading ? 0.7 : 1,
                    }}
                  >
                    {actionLoading ? "Publication…" : "Publier l’annonce"}
                  </button>
                ) : (
                  <button
                    onClick={unpublish}
                    disabled={actionLoading}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid #ddd",
                      background: "white",
                      color: "#111",
                      fontWeight: 900,
                      cursor: "pointer",
                      opacity: actionLoading ? 0.7 : 1,
                    }}
                  >
                    {actionLoading ? "Dépublication…" : "Dépublier"}
                  </button>
                )}

                {/* ✅ Modifier / Supprimer */}
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button
                    onClick={() => {
                      setEditErr("");
                      setEditing((v) => !v);
                    }}
                    disabled={actionLoading}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid #ddd",
                      background: "white",
                      fontWeight: 900,
                      cursor: "pointer",
                      opacity: actionLoading ? 0.7 : 1,
                    }}
                  >
                    {editing ? "Annuler" : "Modifier"}
                  </button>

                  <button
                    onClick={removeAd}
                    disabled={actionLoading}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid #ffb3b3",
                      background: "#ffecec",
                      fontWeight: 900,
                      cursor: "pointer",
                      opacity: actionLoading ? 0.7 : 1,
                    }}
                  >
                    Supprimer
                  </button>
                </div>

                {/* ✅ Formulaire d'édition */}
                {editing && (
                  <div style={{ marginTop: 12 }}>
                    {editErr && <p style={{ color: "crimson", marginTop: 0 }}>{editErr}</p>}

                    <div style={{ display: "grid", gap: 8 }}>
                      <input
                        value={editForm.title}
                        onChange={(e) => setField("title", e.target.value)}
                        placeholder="Titre"
                        style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                      />

                      <textarea
                        value={editForm.description}
                        onChange={(e) => setField("description", e.target.value)}
                        placeholder="Description"
                        rows={5}
                        style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd", resize: "vertical" }}
                      />

                      <input
                        value={editForm.category}
                        onChange={(e) => setField("category", e.target.value)}
                        placeholder="Catégorie"
                        style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                      />

                      <input
                        value={editForm.city}
                        onChange={(e) => setField("city", e.target.value)}
                        placeholder="Ville"
                        style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                      />

                      <input
                        value={editForm.availability}
                        onChange={(e) => setField("availability", e.target.value)}
                        placeholder="Disponibilités (optionnel)"
                        style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                      />

                      <select
                        value={editForm.modality}
                        onChange={(e) => setField("modality", e.target.value)}
                        style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd", background: "white" }}
                      >
                        <option value="REMOTE">À distance</option>
                        <option value="AT_PROVIDER">Chez le prestataire</option>
                        <option value="AT_CUSTOMER">Chez le client</option>
                      </select>

                      <select
                        value={editForm.pricingType}
                        onChange={(e) => setField("pricingType", e.target.value)}
                        style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd", background: "white" }}
                      >
                        <option value="FREE">Gratuit</option>
                        <option value="HOURLY">Horaire</option>
                        <option value="FIXED">Forfait</option>
                      </select>

                      <input
                        type="number"
                        disabled={editForm.pricingType === "FREE"}
                        value={editForm.pricingType === "FREE" ? "" : editForm.price}
                        onChange={(e) => setField("price", e.target.value)}
                        placeholder={editForm.pricingType === "FREE" ? "—" : "Prix"}
                        style={{
                          padding: 10,
                          borderRadius: 12,
                          border: "1px solid #ddd",
                          background: editForm.pricingType === "FREE" ? "#f6f6f6" : "white",
                        }}
                      />

                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={editLoading}
                        style={{
                          marginTop: 4,
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: "1px solid #111",
                          background: "#111",
                          color: "white",
                          fontWeight: 900,
                          cursor: "pointer",
                          opacity: editLoading ? 0.7 : 1,
                        }}
                      >
                        {editLoading ? "Enregistrement…" : "Enregistrer"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pendant que me charge, évite un flash */}
            {isLogged && meLoading && (
              <div style={{ background: "white", border: "1px solid #eee", borderRadius: 16, padding: 16, color: "#666" }}>
                Chargement du profil…
              </div>
            )}

            {/* Auteur + Contacter : uniquement si PAS owner */}
            {!isOwner && (
              <>
                <div style={{ background: "white", border: "1px solid #eee", borderRadius: 16, padding: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Auteur</h3>
                  <p style={{ margin: 0 }}>
                    <b>{ad.author?.pseudo || "—"}</b>
                  </p>
                  <p style={{ margin: "6px 0 0 0", color: "#666" }}>{normalizeCity(ad.author?.city) || "—"}</p>
                  {ad.author?.bio && <p style={{ marginTop: 10 }}>{ad.author.bio}</p>}
                </div>

                <div style={{ background: "white", border: "1px solid #eee", borderRadius: 16, padding: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Contacter</h3>

                  {sendErr && <p style={{ color: "crimson" }}>{sendErr}</p>}

                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd", resize: "vertical" }}
                  />

                  <button
                    onClick={contact}
                    disabled={sending}
                    style={{
                      marginTop: 10,
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid #111",
                      background: "#111",
                      color: "white",
                      fontWeight: 900,
                      cursor: "pointer",
                      opacity: sending ? 0.7 : 1,
                    }}
                  >
                    {sending ? "Envoi…" : "Envoyer"}
                  </button>

                  {!isLogged && (
                    <p style={{ color: "#666", marginTop: 10, fontSize: 13 }}>
                      Tu dois être connecté pour envoyer un message.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
