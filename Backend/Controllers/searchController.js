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
      params: { q, type:"track", limit:10 },
    });
    res.json(response.data.tracks.items);
  } catch (err) {
    res.status(500).json({ error: "Spotify search failed" });
  }
};


export const getArtistsByPreference = async (req, res) => {
  const { artists } = req.query;
  if (!artists) return res.status(400).json({ error: "Artists required" });

  try {
    const token = await getAccessToken();
    const inputArtists = artists.split(",").map(a => a.trim());
    const allArtistNames = new Set();

    // Step 1: Get related artists for each input artist from TasteDive
    for (const name of inputArtists) {
      const tdRes = await axios.get("https://tastedive.com/api/similar", {
        params: {
          q: name,
          type: "music",
          info: 0,
          limit: 10,
          k: process.env.TASTEDIVE_API_KEY,
        },
      });

      const relatedArtists = tdRes.data.similar?.results || [];

      allArtistNames.add(name.replace(/\s/g, ""));
      relatedArtists.forEach((a) => {
        if (a?.name) {
          allArtistNames.add(a.name.replace(/\s/g, ""));
        }
      });
    }

    // Limit total artists to max 15
    const limitedArtistNames = Array.from(allArtistNames).slice(0, 15);

    // Step 2: Search each artist on Spotify to get artist ID and details
    const artistDetails = [];
    for (const artistName of limitedArtistNames) {
      const searchRes = await axios.get("https://api.spotify.com/v1/search", {
        headers: { Authorization: `Bearer ${token}` },
        params: { q: artistName, type: "artist", limit: 1 },
      });
      const found = searchRes.data.artists.items[0];
      if (found) artistDetails.push(found);
    }

    res.json({
      input: artistDetails.filter(a =>
        inputArtists.some(inArtist => a.name.toLowerCase().includes(inArtist.toLowerCase()))
      ),
      similar: artistDetails.filter(a =>
        !inputArtists.some(inArtist => a.name.toLowerCase().includes(inArtist.toLowerCase()))
      ),
    });
  } catch (err) {
    console.error("Failed to fetch artists:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch artists by preference" });
  }
};

// 2. /api/spotify/recommendations-by-artists?artists=Arijit Singh,Taylor Swift
export const getRecommendations = async (req, res) => {
  const { artists } = req.query;
  if (!artists) return res.status(400).json({ error: "Artists required" });

  try {
    const token = await getAccessToken();

    const inputArtists = artists.split(",").map((a) => a.trim().replace(/\s+/g, ""));

    const tasteDiveKey = process.env.TASTEDIVE_API_KEY;
    const similarArtistsSet = new Set();

    for (const artistName of inputArtists) {
      const tdRes = await axios.get("https://tastedive.com/api/similar", {
        params: {
          q: artistName,
          type: "music",
          info: 1,
          limit: 5,
          k: tasteDiveKey,
        },
      });

      similarArtistsSet.add(artistName);
      const similar = tdRes.data.Similar?.Results || [];
      for (const s of similar) {
        if (s.Name) similarArtistsSet.add(s.Name.replace(/\s+/g, ""));
      }
    }

    // No limit on number of artists here
    const allArtists = Array.from(similarArtistsSet);

    // Get Spotify artist IDs for all artists
    const artistIDs = [];
    for (const name of allArtists) {
      const searchRes = await axios.get("https://api.spotify.com/v1/search", {
        headers: { Authorization: `Bearer ${token}` },
        params: { q: name, type: "artist", limit: 1 },
      });

      const artist = searchRes.data.artists.items[0];
      if (artist) artistIDs.push(artist.id);
    }

    if (artistIDs.length === 0) {
      return res.status(404).json({ error: "No artists found on Spotify" });
    }

    // Fetch top tracks for each artist ID and collect ALL tracks
    const allTopTracks = [];
    for (const artistId of artistIDs) {
      const topTracksRes = await axios.get(
        `https://api.spotify.com/v1/artists/${artistId}/top-tracks`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { market: "IN" },
        }
      );

      allTopTracks.push(...topTracksRes.data.tracks);
    }

    // Limit total tracks to max 20 here
    const limitedTracks = allTopTracks.slice(0, 20);

    res.json({ tracks: limitedTracks });
  } catch (err) {
    console.error("Failed to fetch recommendations:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch recommendations" });
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
        params: { market: "IN" }, // or "US", depending on your audience
      }
    );
    res.json(response.data.tracks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch artist's tracks" });
  }
};

export const getTrackById = async (req, res) => {
  const { ids } = req.query;

  if (!ids) {
    return res.status(400).json({ error: 'Missing track IDs in query' });
  }

  const idArray = ids.split(',');
  if (idArray.length > 50) {
    return res.status(400).json({ error: 'Cannot fetch more than 50 tracks at once' });
  }

  try {
    const token = await getAccessToken();
    const response = await axios.get(
      `https://api.spotify.com/v1/tracks?ids=${ids}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    res.json({ tracks: response.data.tracks });
  } catch (error) {
    console.error('Spotify fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch track details' });
  }
}

export const getArtistImage = async (req, res) => {
  const { artistName } = req.query;
  if (!artistName)
    return res.status(400).json({ error: "Artist name required" });

  const token = await getAccessToken();

  try {
    const response = await axios.get(
      "https://api.spotify.com/v1/search",
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          q: artistName,
          type: "artist",
          limit: 1,
        },
      }
    );

    const artist = response.data.artists.items[0];

    if (!artist || !artist.images.length) {
      return res.json({ image: null });
    }

    return res.json({ image: artist.images[0].url });

  } catch (error) {
    console.error("Error fetching artist image:", error);
    return res.status(500).json({ image: null });
  }
};
