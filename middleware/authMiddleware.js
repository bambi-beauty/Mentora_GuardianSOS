import jwt from 'jsonwebtoken';
import User from '../model/userModel.js'

export const protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token payload:", decoded);
    
    const userId = decoded.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Invalid token payload: userId missing' });
    }

    req.user = await User.findById(userId).select('-password');

    if (!req.user) {
      return res.status(401).json({ error: 'User not found for decoded token: ' + userId });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Not authorized, token invalid' });
  }
};
