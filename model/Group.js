import mongoose from 'mongoose';

// Message sub-schema for chat messages inside groups
const messageSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',       // Reference to User model
    required: true 
  },
  text: { 
    type: String, 
    required: true 
  },
  time: { 
    type: Date, 
    default: Date.now 
  },
  type: { 
    type: String, 
    enum: ['text', 'alert', 'announcement'], 
    default: 'text' 
  }
}, { _id: true });  


const groupSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  description: { 
    type: String 
  },
  category: { 
    type: String, 
    default: 'Residential', 
    enum: ['Residential', 'Business', 'Campus', 'Park', 'Other'] 
  },
  alerts: { 
    type: Number, 
    default: 0 
  },
  members: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'  // List of users who joined this group
  }],
  membersOnline: {
    type: Number,
    default: 0
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  lastActive: { 
    type: Date, 
    default: Date.now 
  },
  messages: [messageSchema]
}, {
  timestamps: true
});

const Group = mongoose.model('Group', groupSchema);

export default Group;
