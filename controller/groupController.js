import Group from '../model/Group.js';
import User from '../model/userModel.js';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';

// Error handler utility
const handleError = (res, error, defaultMessage = 'Server error') => {
  console.error('Error:', error);
  res.status(500).json({ 
    message: defaultMessage,
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

export const createGroup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, description, category } = req.body;
    const userId = req.user._id;

    const existingGroup = await Group.findOne({ name });
    if (existingGroup) {
      return res.status(400).json({ message: 'Group name already exists' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create initial welcome announcement message
    const welcomeMessage = {
      user: userId,
      text: `Welcome to ${name}! Start the conversation with your neighbors.`,
      type: 'announcement',
      time: new Date()
    };

    const newGroup = new Group({
      name,
      description,
      category: category || 'Residential',
      members: [userId],
      createdBy: userId,
      lastActive: new Date(),
      messages: [welcomeMessage]
    });

    const savedGroup = await newGroup.save();
    
    // Populate the response to match frontend expectations
    const populatedGroup = await Group.findById(savedGroup._id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .populate('messages.user', 'name email');

    // FIXED: Return the exact format frontend expects
    const responseGroup = {
      _id: populatedGroup._id,
      name: populatedGroup.name,
      description: populatedGroup.description,
      category: populatedGroup.category,
      alerts: populatedGroup.alerts || 0,
      members: populatedGroup.members.length, // Frontend expects count
      membersOnline: 1, // Creator is online
      createdBy: populatedGroup.createdBy, // Frontend expects object with name/email
      lastActive: formatLastActive(populatedGroup.lastActive),
      messages: populatedGroup.messages.map(msg => ({
        _id: msg._id,
        user: msg.user.name, // Frontend expects string name
        text: msg.text,
        time: formatTime(msg.time),
        type: msg.type
      })),
      isMember: true, // Frontend expects this field
      createdAt: populatedGroup.createdAt,
      updatedAt: populatedGroup.updatedAt
    };

    res.status(201).json(responseGroup);

  } catch (error) {
    console.error('Create group error:', error);
    handleError(res, error, 'Server error while creating group');
  }
};

// Get all groups with filtering and pagination
export const getGroups = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { category, page = 1, limit = 50 } = req.query;
    const userId = req.user?._id; // Note: user might not be authenticated for some requests

    console.log('🔍 Getting groups for user:', userId, 'category:', category);

    // Build filter
    const filter = {};
    if (category && category !== 'All') {
      filter.category = category;
    }

    // Get groups with population and sorting
    const groups = await Group.find(filter)
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .sort({ lastActive: -1 })
      .limit(parseInt(limit))
      .lean();

    console.log('✅ Found groups:', groups.length);

    // Transform data to match frontend expectations
    const transformedGroups = groups.map(group => {
      const isMember = userId ? group.members.some(member => 
        member._id.toString() === userId.toString()
      ) : false;

      console.log(`Group "${group.name}": members=${group.members.length}, isMember=${isMember}`);

      return {
        _id: group._id.toString(),
        name: group.name,
        description: group.description,
        category: group.category,
        alerts: group.alerts || 0,
        members: group.members.length, // Send count instead of array
        membersOnline: group.membersOnline || Math.floor(group.members.length * 0.2), // Estimate
        createdBy: group.createdBy, // Keep as object for getCreatedByText function
        lastActive: formatLastActive(group.lastActive || group.updatedAt),
        isMember: isMember, // Frontend expects this field
        createdAt: group.createdAt,
        updatedAt: group.updatedAt
      };
    });

    res.json(transformedGroups); // Frontend expects array, not nested object

  } catch (error) {
    console.error('Get groups error:', error);
    handleError(res, error, 'Server error while fetching groups');
  }
};

// Get single group by ID with messages
export const getGroupById = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const groupId = req.params.id;
    const userId = req.user._id;

    console.log('🔍 Getting group by ID:', groupId, 'for user:', userId);

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Invalid group ID format' });
    }

    const group = await Group.findById(groupId)
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .populate('messages.user', 'name email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member
    const isMember = group.members.some(member => 
      member._id.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({ 
        message: 'You must join the group to view messages',
        group: {
          _id: group._id,
          name: group.name,
          description: group.description,
          category: group.category,
          isMember: false
        }
      });
    }

    console.log('✅ Group found, messages:', group.messages.length);

    // Transform group data to match frontend expectations
    const transformedGroup = {
      _id: group._id.toString(),
      name: group.name,
      description: group.description,
      category: group.category,
      alerts: group.alerts || 0,
      members: group.members.length,
      membersOnline: group.membersOnline || Math.floor(group.members.length * 0.2),
      createdBy: group.createdBy,
      lastActive: formatLastActive(group.lastActive),
      isMember: true,
      messages: group.messages.map(msg => ({
        _id: msg._id.toString(),
        user: msg.user?.name || 'Unknown', // Frontend expects string
        text: msg.text,
        time: formatTime(msg.time),
        type: msg.type,
        userId: msg.user?._id // Include userId for message alignment
      })),
      createdAt: group.createdAt,
      updatedAt: group.updatedAt
    };

    res.json(transformedGroup);

  } catch (error) {
    console.error('Get group by ID error:', error);
    handleError(res, error, 'Server error while fetching group');
  }
};

// Join a group
export const joinGroup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const groupId = req.params.id;
    const userId = req.user._id;

    console.log('👥 User joining group:', userId, '->', groupId);

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Invalid group ID format' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is already a member
    if (group.members.includes(userId)) {
      return res.status(400).json({ message: 'User is already a member of this group' });
    }

    // Add user to members
    group.members.push(userId);
    group.lastActive = new Date();
    
    // Add join announcement
    const user = await User.findById(userId);
    const joinMessage = {
      user: userId,
      text: `${user.name} joined the group`,
      type: 'announcement',
      time: new Date()
    };
    
    group.messages.push(joinMessage);
    await group.save();

    console.log('✅ User joined group successfully');

    // Return updated group info in frontend format
    const updatedGroup = await Group.findById(groupId)
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .populate('messages.user', 'name email');

    const responseGroup = {
      _id: updatedGroup._id.toString(),
      name: updatedGroup.name,
      description: updatedGroup.description,
      category: updatedGroup.category,
      alerts: updatedGroup.alerts || 0,
      members: updatedGroup.members.length,
      membersOnline: updatedGroup.membersOnline || Math.floor(updatedGroup.members.length * 0.2),
      createdBy: updatedGroup.createdBy,
      lastActive: formatLastActive(updatedGroup.lastActive),
      isMember: true,
      messages: updatedGroup.messages.map(msg => ({
        _id: msg._id.toString(),
        user: msg.user?.name || 'Unknown',
        text: msg.text,
        time: formatTime(msg.time),
        type: msg.type
      }))
    };

    res.json(responseGroup);

  } catch (error) {
    console.error('Join group error:', error);
    handleError(res, error, 'Server error while joining group');
  }
};

// Leave a group
export const leaveGroup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const groupId = req.params.id;
    const userId = req.user._id;

    console.log('👋 User leaving group:', userId, '->', groupId);

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member
    if (!group.members.includes(userId)) {
      return res.status(400).json({ message: 'User is not a member of this group' });
    }

    // Remove user from members
    group.members = group.members.filter(id => id.toString() !== userId.toString());
    group.lastActive = new Date();
    
    // Add leave announcement
    const user = await User.findById(userId);
    const leaveMessage = {
      user: userId,
      text: `${user.name} left the group`,
      type: 'announcement',
      time: new Date()
    };
    
    group.messages.push(leaveMessage);
    await group.save();

    console.log('✅ User left group successfully');

    res.json({ message: 'Successfully left group' });

  } catch (error) {
    console.error('Leave group error:', error);
    handleError(res, error, 'Server error while leaving group');
  }
};

// Add message to group
export const addMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const groupId = req.params.id;
    const userId = req.user._id;
    const { text, type = 'text' } = req.body;

    console.log('💬 Adding message to group:', groupId, 'user:', userId);

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member
    if (!group.members.includes(userId)) {
      return res.status(403).json({ message: 'Must be a member to post messages' });
    }

    // Create new message
    const newMessage = {
      user: userId,
      text: text.trim(),
      type,
      time: new Date()
    };

    group.messages.push(newMessage);
    group.lastActive = new Date();
    await group.save();

    console.log('✅ Message added successfully');

    // Populate the new message with user info
    const populatedGroup = await Group.findById(groupId)
      .populate('messages.user', 'name email');

    const latestMessage = populatedGroup.messages[populatedGroup.messages.length - 1];
    
    // Transform message to match frontend format
    const transformedMessage = {
      _id: latestMessage._id.toString(),
      user: latestMessage.user.name, // Frontend expects string
      text: latestMessage.text,
      time: formatTime(latestMessage.time),
      type: latestMessage.type,
      userId: latestMessage.user._id // Include for frontend alignment
    };

    res.status(201).json(transformedMessage);

  } catch (error) {
    console.error('Add message error:', error);
    handleError(res, error, 'Server error while adding message');
  }
};

// Get user's groups
export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const groups = await Group.find({ members: userId })
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .sort({ lastActive: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const transformedGroups = groups.map(group => ({
      _id: group._id.toString(),
      name: group.name,
      description: group.description,
      category: group.category,
      alerts: group.alerts || 0,
      members: group.members.length,
      membersOnline: group.membersOnline || Math.floor(group.members.length * 0.2),
      createdBy: group.createdBy,
      lastActive: formatLastActive(group.lastActive),
      isMember: true,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt
    }));

    res.json(transformedGroups);

  } catch (error) {
    console.error('Get user groups error:', error);
    handleError(res, error, 'Server error while fetching user groups');
  }
};

// Utility functions
const formatLastActive = (date) => {
  if (!date) return 'Recently';
  
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return new Date(date).toLocaleDateString();
};

const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};