// routes/spotifyRoutes.js
import express from "express";
import {
  searchTracks,
  getRecommendations,
  getArtistsByPreference,
  getTracksByArtist,
} from "../controllers/searchController.js";

const router = express.Router();

router.get("/search", searchTracks);
router.get("/recommendations", getRecommendations);
router.get("/artists", getArtistsByPreference);
router.get("/artist-tracks/:artistId", getTracksByArtist);

export default router;
