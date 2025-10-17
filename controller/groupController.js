import Group from '../model/Group.js';
import User from '../model/userModel.js';


export const createGroup = async (req, res) => {
  try {
    const { name, description, category } = req.body;
    const userId = req.user._id;  // Assuming you get user info from auth middleware

    const existingGroup = await Group.findOne({ name });
    if (existingGroup) {
      return res.status(400).json({ message: 'Group name already exists' });
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
      category,
      members: [userId],
      createdBy: userId,
      lastActive: new Date(),
      messages: [welcomeMessage]
    });

    const savedGroup = await newGroup.save();
    res.status(201).json(savedGroup);

  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Server error while creating group' });
  }
};

// Get all groups (with optional category filter)
export const getGroups = async (req, res) => {
  try {
    const category = req.query.category;

    const filter = {};
    if (category && category !== 'All') {
      filter.category = category;
    }

    const groups = await Group.find(filter)
      .populate('createdBy', 'name email')  // populate creator info
      .populate('members', 'name')           // optionally populate members (or just count)
      .sort({ lastActive: -1 });              // most recently active first

    res.json(groups);

  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Server error while fetching groups' });
  }
};

// Get a single group by ID with messages
export const getGroupById = async (req, res) => {
  try {
    const groupId = req.params.id;

    const group = await Group.findById(groupId)
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .populate('messages.user', 'name email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json(group);

  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ message: 'Server error while fetching group' });
  }
};

// Join a group
export const joinGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.members.includes(userId)) {
      return res.status(400).json({ message: 'User already a member' });
    }

    group.members.push(userId);
    group.lastActive = new Date();
    await group.save();

    res.json({ message: 'Joined group successfully' });

  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ message: 'Server error while joining group' });
  }
};

// Leave a group
export const leaveGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!group.members.includes(userId)) {
      return res.status(400).json({ message: 'User is not a member' });
    }

    group.members = group.members.filter(id => id.toString() !== userId.toString());
    group.lastActive = new Date();
    await group.save();

    res.json({ message: 'Left group successfully' });

  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({ message: 'Server error while leaving group' });
  }
};

// Add message to group chat
export const addMessage = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id;
    const { text, type } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!group.members.includes(userId)) {
      return res.status(403).json({ message: 'Must be a member to post messages' });
    }

    const newMessage = {
      user: userId,
      text,
      type: type || 'text',
      time: new Date()
    };

    group.messages.push(newMessage);
    group.lastActive = new Date();
    await group.save();

    const populatedGroup = await group.populate('messages.user', 'name email').execPopulate();

    res.status(201).json(populatedGroup.messages[populatedGroup.messages.length - 1]);

  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ message: 'Server error while adding message' });
  }
};
