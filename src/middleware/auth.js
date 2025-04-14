// middleware/auth.js
export default (req, res, next) => {
    if (req.session.userId) {
      return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
  };
  