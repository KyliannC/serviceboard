import { createContext, useMemo, useState } from "react";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem("token"));

  function setToken(t) {
    if (t) localStorage.setItem("token", t);
    else localStorage.removeItem("token");
    setTokenState(t);
  }

  const value = useMemo(() => ({
    token,
    setToken,
    isLogged: !!token
  }), [token]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}