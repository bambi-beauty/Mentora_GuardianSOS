import User from '../model/userModel.js';
import UserImage from '../model/UserImageModel.js';

export const uploadUserImage = async (req, res) => {
  console.log('Received upload request for user:', req.params.userId);
  console.log('File info:', req.file);

  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  // Correctly format the imageUrl string (use backticks for template literal)
  const imageUrl = `/uploads/${req.file.filename}`;

  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newImage = new UserImage({
      user: user._id,
      imageUrl,
    });

    await newImage.save();

    res.status(201).json({ message: 'Image uploaded successfully', image: newImage });
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
    res.json(images); // returns an array of image docs with imageUrl fields
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};