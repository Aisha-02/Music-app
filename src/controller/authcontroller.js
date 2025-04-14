// controllers/authController.js
import { hash, compare } from 'bcrypt';
import User, { findOne } from '../models/User';

export async function register(req, res) {
  const { username, email, phone, password } = req.body;
  try {
    const existingUser = await findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already in use' });

    const hashedPassword = await hash(password, 10);
    const user = new User({ username, email, phone, password: hashedPassword });
    await user.save();
    req.session.userId = user._id;
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  try {
    const user = await findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const match = await compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    req.session.userId = user._id;
    res.json({ message: 'Logged in successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
}

export function logout(req, res) {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
}

export function dashboard(req, res) {
  res.json({ message: 'Welcome to your dashboard' });
}
