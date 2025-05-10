// controllers/spotifyController.js
import axios from "axios";
import { getAccessToken } from "../Utils/Auth.js";

// 1. /search?q=...
export const searchTracks = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Missing query" });

  try {
    const token = await getAccessToken();
    const response = await axios.get("https://api.spotify.com/v1/search", {
      headers: { Authorization: `Bearer ${token}` },
      params: { q, type: "track", limit: 10 },
    });
    res.json(response.data.tracks.items);
  } catch (err) {
    res.status(500).json({ error: "Spotify search failed" });
  }
};

// 2. /recommendations?genre=Pop
export const getRecommendations = async (req, res) => {
  const { genres } = req.query; // genres = "pop,rock,hip hop"
  if (!genres) return res.status(400).json({ error: "Genres required" });

  try {
    const token = await getAccessToken();
    const genreList = genres.split(",").map(g => g.trim()).slice(0, 5);

    const artistsMap = new Map();

    // Step 1: Fetch artists per genre
    for (const genre of genreList) {
      const searchRes = await axios.get("https://api.spotify.com/v1/search", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          q: genre,
          type: "artist",
          limit: 10,
        },
      });

      const foundArtists = searchRes.data.artists.items;
      for (const artist of foundArtists) {
        if (!artistsMap.has(artist.id)) {
          artistsMap.set(artist.id, artist);
          if (artistsMap.size >= 10) break;
        }
      }

      if (artistsMap.size >= 10) break;
    }

    const topTracks = [];

    // Step 2: Get top track per artist
    for (const [artistId, artist] of artistsMap.entries()) {
      const topTrackRes = await axios.get(`https://api.spotify.com/v1/artists/${artistId}/top-tracks`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { market: "US" }, // required param
      });

      const tracks = topTrackRes.data.tracks;
      if (tracks.length > 0) {
        topTracks.push({
          artist: artist.name,
          artistId: artist.id,
          track: tracks[0], // top 1 song
        });
      }
    }

    res.json(topTracks);
  } catch (err) {
    console.error("Failed to fetch artist-based recommendations:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
};

// 3. /artists?genre=Pop
export const getArtistsByPreference = async (req, res) => {
  const { genres } = req.query;
  if (!genres) return res.status(400).json({ error: "Genre required" });

  try {
    const token = await getAccessToken();
    const response = await axios.get("https://api.spotify.com/v1/search", {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: genres, type: "artist", limit: 10 },
    });
    res.json(response.data.artists.items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch artists" });
  }
};

// 4. /artist-tracks/:artistId
export const getTracksByArtist = async (req, res) => {
  const { artistId } = req.params;
  if (!artistId) return res.status(400).json({ error: "Artist ID required" });

  try {
    const token = await getAccessToken();
    const response = await axios.get(
      `https://api.spotify.com/v1/artists/${artistId}/top-tracks`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { market: "IN"  }, // or "US", depending on your audience
      }
    );
    res.json(response.data.tracks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch artist's tracks" });
  }
};
