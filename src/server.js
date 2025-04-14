// server.js
import { createServer } from 'http';
import express, { json, urlencoded } from 'express';
import sessionMiddleware from './middleware/session';
import routes from './routes/auth';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(json());
app.use(urlencoded({ extended: true }));

// Routes
app.use('/', sessionMiddleware, routes);

// Create server
const server = createServer(app);

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
