import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../api/axios";
import { useAuth } from "../auth/useAuth";

export default function Profile() {
  const [me, setMe] = useState(null);
  const [err, setErr] = useState("");
  const [bioDraft, setBioDraft] = useState("");
  const [saveErr, setSaveErr] = useState("");
  const [saveOk, setSaveOk] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { setToken } = useAuth();

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/auth/me");
        setMe(res.data);
        setBioDraft(res.data?.bio || "");
      } catch (error) {
        console.error(error);
        setErr("Unauthorized");
        setToken(null);
        navigate("/login");
      }
    }
    load();
  }, [navigate, setToken]);

  async function saveBio() {
    setSaveErr("");
    setSaveOk("");

    if (bioDraft.length > 300) {
      setSaveErr("La bio doit faire 300 caractères max.");
      return;
    }

    setSaving(true);
    try {
      const res = await api.patch("/auth/me", { bio: bioDraft });
      setMe(res.data);
      setBioDraft(res.data?.bio || "");
      setSaveOk("Bio mise à jour.");
    } catch (e) {
      setSaveErr(e.response?.data?.error || "Erreur mise à jour bio");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <h2 style={{ marginTop: 0 }}>Profil</h2>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {!me ? (
        <p>Chargement...</p>
      ) : (
        <div style={{ background: "white", border: "1px solid #eee", borderRadius: 14, padding: 16 }}>
          <p><b>Pseudo:</b> {me.pseudo}</p>
          <p><b>Email:</b> {me.email}</p>
          <p><b>Ville:</b> {me.city}</p>
          <div style={{ marginTop: 12 }}>
            <p style={{ marginBottom: 8 }}><b>Bio:</b></p>
            <textarea
              value={bioDraft}
              onChange={(e) => setBioDraft(e.target.value)}
              rows={5}
              placeholder="Parle un peu de toi..."
              style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd", resize: "vertical" }}
            />
            <p style={{ marginTop: 8, color: "#666", fontSize: 13 }}>{bioDraft.length}/300</p>
            {saveErr && <p style={{ color: "crimson" }}>{saveErr}</p>}
            {saveOk && <p style={{ color: "green" }}>{saveOk}</p>}
            <button
              type="button"
              onClick={saveBio}
              disabled={saving}
              style={{
                padding: "9px 12px",
                borderRadius: 12,
                border: "1px solid #111",
                background: "#111",
                color: "white",
                fontWeight: 800,
                cursor: "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Enregistrement..." : "Enregistrer la bio"}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
