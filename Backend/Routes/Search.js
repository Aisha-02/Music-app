// routes/spotifyRoutes.js
import express from "express";
import {
  searchTracks,
  getRecommendations,
  getArtistsByPreference,
  getTracksByArtist,
  getTrackById,
  getArtistImage
} from "../Controllers/searchController.js";

const router = express.Router();

router.get("/search", searchTracks);
router.get("/recommendations", getRecommendations);
router.get("/artists", getArtistsByPreference);
router.get("/artist-tracks/:artistId", getTracksByArtist);
router.get("/artist-image",getArtistImage);
router.get("/tracks" , getTrackById); // This route seems redundant, consider removing it

export default router;
