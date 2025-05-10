// index.js
import dotenv from "dotenv";
import express, { json } from "express";
import spotifyRoutes from "./Routes/Search.js";
import cors from "cors";
import morgan from "morgan";

const app = express();
const PORT = process.env.PORT || 3000;

dotenv.config();

app.use(json());
app.use(cors());
app.use(morgan("dev"));
app.use("/api/spotify", spotifyRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
