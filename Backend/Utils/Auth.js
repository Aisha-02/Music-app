// utils/spotifyAuth.js
import axios from "axios";

let accessToken = "";
let tokenExpiresAt = 0;

 export async function getAccessToken() {
  const now = Date.now();

  if (accessToken && now < tokenExpiresAt) {
    return accessToken;
  }

  const authOptions = {
    method: "post",
    url: "https://accounts.spotify.com/api/token",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
    },
    data: "grant_type=client_credentials",
  };

  const response = await axios(authOptions);
  accessToken = response.data.access_token;
  tokenExpiresAt = now + response.data.expires_in * 1000;

  return accessToken;
}

