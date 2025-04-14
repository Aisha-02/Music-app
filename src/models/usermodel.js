// models/User.js
import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  username: { type: String, required: true },
  phone: { type: String },
  email: { type: String, required: true, unique: true },
  profilePhoto: { type: String },
  password: { type: String, required: true },
}, { timestamps: true });

export default model('User', userSchema);
