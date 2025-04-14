// routes/auth.js
import { Router } from 'express';
const router = Router();
import { register, login, logout, dashboard } from '../controllers/authController';
import authMiddleware from '../middleware/auth';

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/dashboard', authMiddleware, dashboard);

export default router;
