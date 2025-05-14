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

// 2. /recommendations?artists=Arijit Singh,Taylor Swift
export const getRecommendations = async (req, res) => {
  const { artists } = req.query; // comma-separated artist names
  if (!artists) return res.status(400).json({ error: "Artists required" });

  try {
    const token = await getAccessToken();
    const artistNames = artists.split(",").map(a => a.trim()).slice(0, 5); // limit to 5 inputs

    const artistMap = new Map();

    // Step 1: Search for provided artists by name
    for (const name of artistNames) {
      const searchRes = await axios.get("https://api.spotify.com/v1/search", {
        headers: { Authorization: `Bearer ${token}` },
        params: { q: name, type: "artist", limit: 1 },
      });

      const found = searchRes.data.artists.items[0];
      if (found && !artistMap.has(found.id)) {
        artistMap.set(found.id, found);
      }
    }

    // Step 2: Add similar artists (via related-artists)
    for (const id of Array.from(artistMap.keys())) {
      const relatedRes = await axios.get(
        `https://api.spotify.com/v1/artists/${id}/related-artists`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const similar = relatedRes.data.artists.slice(0, 2); // 2 similar per input artist
      similar.forEach(sim => {
        if (!artistMap.has(sim.id) && artistMap.size < 10) {
          artistMap.set(sim.id, sim);
        }
      });
    }

    // Step 3: Fetch top tracks from the collected artists
    const tracks = [];
    for (const [artistId, artist] of artistMap.entries()) {
      const topRes = await axios.get(
        `https://api.spotify.com/v1/artists/${artistId}/top-tracks`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { market: "US" },
        }
      );
      if (topRes.data.tracks.length > 0) {
        tracks.push({
          artist: artist.name,
          artistId: artist.id,
          track: topRes.data.tracks[0], // top 1 track
        });
      }
      if (tracks.length >= 10) break;
    }

    res.json(tracks);
  } catch (err) {
    console.error("Error in artist-based recommendations:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
};

// 3. /artists?artists=Arijit Singh,Taylor Swift
export const getArtistsByPreference = async (req, res) => {
  const { artists } = req.query;
  if (!artists) return res.status(400).json({ error: "Artists required" });

  try {
    const token = await getAccessToken();
    const inputArtists = artists.split(",").map(a => a.trim());
    const result = [];

    // Step 1: Search input artists
    for (const name of inputArtists) {
      const searchRes = await axios.get("https://api.spotify.com/v1/search", {
        headers: { Authorization: `Bearer ${token}` },
        params: { q: name, type: "artist", limit: 1 },
      });

      const found = searchRes.data.artists.items[0];
      if (found) result.push(found);
    }

    // Step 2: Get similar artists
    const similarSet = new Map();
    for (const artist of result) {
      const relatedRes = await axios.get(
        `https://api.spotify.com/v1/artists/${artist.id}/related-artists`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const similar = relatedRes.data.artists.slice(0, 3); // top 3 similar
      for (const sim of similar) {
        if (!similarSet.has(sim.id)) {
          similarSet.set(sim.id, sim);
        }
      }
    }

    // Final response: input artists + similar artists
    res.json({
      input: result,
      similar: Array.from(similarSet.values()),
    });
  } catch (err) {
    console.error("Failed to fetch artists:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch artists by preference" });
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
