import mongoose from 'mongoose';

// Message sub-schema for chat messages inside groups
const messageSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',       
    required: true 
  },
  text: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 1000
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
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  description: { 
    type: String,
    trim: true,
    maxlength: 500 
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
    ref: 'User'
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

groupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

groupSchema.set('toJSON', { virtuals: true });

const Group = mongoose.model('Group', groupSchema);

export default Group;