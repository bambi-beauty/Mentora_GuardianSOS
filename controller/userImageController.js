import User from '../model/userModel.js';
import UserImage from '../model/UserImageModel.js';

export const uploadUserImage = async (req, res) => {
  console.log('Received upload request for user:', req.params.userId);
  console.log('File info:', req.file);

  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  // Return full URL for mobile app compatibility
  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Update user's profileImage field
    user.profileImage = imageUrl;
    await user.save();

    // Also save to UserImage collection for history
    const newImage = new UserImage({
      user: user._id,
      imageUrl,
    });

    await newImage.save();

    res.status(201).json({ 
      message: 'Image uploaded successfully', 
      image: newImage,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage
      }
    });
  } catch (err) {
    console.error('Error saving image:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

export const getUserImages = async (req, res) => {
  try {
    const images = await UserImage.find({ user: req.params.userId });
    if (!images || images.length === 0) {
      return res.status(404).json({ error: 'No images found for this user' });
    }
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

export const getCurrentUserProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('profileImage name email');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      profileImage: user.profileImage,
      name: user.name,
      email: user.email
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};