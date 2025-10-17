import jwt from 'jsonwebtoken';

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authorization header missing or malformed' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId }; // match with `login` payload
    next();
  } catch (error) {
    console.error('JWT verify error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default authenticate;
