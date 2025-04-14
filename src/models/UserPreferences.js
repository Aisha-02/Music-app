// models/UserPreferences.js
import { Schema, model } from 'mongoose';

const userPreferencesSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  favoriteArtists: [String],
  favoriteGenres: [String],
  favoriteAlbums: [String],
  favoriteSongs: [String],
  preferredLanguages: [String],
  preferredMoods: [String],
  listeningTimes: [String],
  preferredDevices: [String],
});

export default model('UserPreferences', userPreferencesSchema);
