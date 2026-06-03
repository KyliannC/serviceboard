import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import Ads from "./pages/Ads.jsx";
import Chat from "./pages/Chat.jsx";
import { useAuth } from "./auth/useAuth";
import AdDetails from "./pages/AdDetails.jsx";
import CreateAd from "./pages/CreateAd.jsx";
import MyAds from "./pages/MyAds.jsx";

function RequireAuth({ children }) {
  const { isLogged } = useAuth();
  return isLogged ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/ads" />} />

      <Route path="/ads" element={<Ads />} />
      <Route path="/ads/:id" element={<AdDetails />} />
      <Route
        path="/ads/new"
        element={
          <RequireAuth>
            <CreateAd />
          </RequireAuth>
        }
      />
      <Route
        path="/my-ads"
        element={
          <RequireAuth>
            <MyAds />
          </RequireAuth>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/profile"
        element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        }
      />
      <Route
        path="/chat"
        element={
          <RequireAuth>
            <Chat />
          </RequireAuth>
        }
      />
    </Routes>
  );
}