// models/UserImage.js
import mongoose from 'mongoose';

const userImageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const UserImage = mongoose.model('UserImage', userImageSchema);
export default UserImage;
