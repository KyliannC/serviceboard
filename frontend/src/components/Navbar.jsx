import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function Navbar() {
  const navigate = useNavigate();
  const { isLogged, setToken } = useAuth();

  function logout() {
    setToken(null);
    navigate("/login");
  }

  const linkStyle = ({ isActive }) => ({
    padding: "8px 10px",
    borderRadius: 10,
    textDecoration: "none",
    color: isActive ? "white" : "#222",
    background: isActive ? "#111" : "transparent",
    fontWeight: 700,
  });

  return (
    <header style={{ borderBottom: "1px solid #e9e9e9", background: "white" }}>
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: "14px clamp(12px, 2vw, 28px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 900, letterSpacing: 0.3 }}>ServiceBoard</span>

          <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <NavLink to="/ads" end style={linkStyle}>
              Annonces
            </NavLink>

            {isLogged && <NavLink to="/my-ads" style={linkStyle}>Mes annonces</NavLink>}

            {isLogged && (
              <NavLink to="/chat" style={linkStyle}>
                Chat
              </NavLink>
            )}

            {isLogged && (
              <NavLink to="/profile" style={linkStyle}>
                Profil
              </NavLink>
            )}
          </nav>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {!isLogged ? (
            <>
              <button
                onClick={() => navigate("/login")}
                style={{
                  padding: "9px 12px",
                  borderRadius: 12,
                  border: "1px solid #ddd",
                  background: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Se connecter
              </button>
              <button
                onClick={() => navigate("/register")}
                style={{
                  padding: "9px 12px",
                  borderRadius: 12,
                  border: "1px solid #111",
                  background: "#111",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                S’inscrire
              </button>
            </>
          ) : (
            <button
              onClick={logout}
              style={{
                padding: "9px 12px",
                borderRadius: 12,
                border: "1px solid #111",
                background: "#111",
                color: "white",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Déconnexion
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
