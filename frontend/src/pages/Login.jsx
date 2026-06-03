import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../auth/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const { setToken } = useAuth();

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      const res = await api.post("/auth/login", { email, password });
      setToken(res.data.token);
      navigate("/profile");
    } catch (e2) {
      setErr(e2.response?.data?.error || "Login failed");
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h2>Login</h2>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      <form onSubmit={onSubmit}>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 10 }} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 10 }} />
        <button style={{ padding: 10, width: "100%" }}>Se connecter</button>
      </form>
      <p style={{ marginTop: 10 }}>
        Pas de compte ? <Link to="/register">Créer un compte</Link>
      </p>
    </div>
  );
}