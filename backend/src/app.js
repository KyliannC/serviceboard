const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const adsRoutes = require("./routes/ads.routes");
const conversationsRoutes = require("./routes/conversations.routes");


const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: false }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/ads", adsRoutes);
app.use("/conversations", conversationsRoutes);


// 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

app.listen(3000, () => console.log("API on http://localhost:3000"));

