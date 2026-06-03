import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

function normalizeCity(value) {
  const clean = String(value || "").trimStart().toLowerCase();
  if (!clean) return "";
  return clean
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function Register() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    pseudo: "",
    city: "",
    bio: "",
  });
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  function set(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      await api.post("/auth/register", form);
      navigate("/login");
    } catch (e2) {
      setErr(e2.response?.data?.error || "Register failed");
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h2>Register</h2>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      <form onSubmit={onSubmit}>
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />
        <input
          placeholder="Pseudo"
          value={form.pseudo}
          onChange={(e) => set("pseudo", e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />
        <input
          placeholder="City"
          value={form.city}
          onChange={(e) => set("city", normalizeCity(e.target.value))}
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />
        <input
          placeholder="Bio (optionnel)"
          value={form.bio}
          onChange={(e) => set("bio", e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />
        <button style={{ padding: 10, width: "100%" }}>Créer le compte</button>
      </form>
      <p style={{ marginTop: 10 }}>
        Déjà un compte ? <Link to="/login">Se connecter</Link>
      </p>
    </div>
  );
}
