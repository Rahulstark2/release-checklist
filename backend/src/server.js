import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import releaseRoutes from "./routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/v1/health", (req, res) => res.json({ ok: true }));
app.use("/api/v1", releaseRoutes);

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`ReleaseCheck API listening on port ${PORT}`);
});
