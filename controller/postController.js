import Post from '../model/Post.js';
import mongoose from 'mongoose';

export const createPost = async (req, res) => {
  try {
    const { text, image, type } = req.body;
    const userId = req.user._id;
    if (!text && !image) return res.status(400).json({ message: 'Post cannot be empty' });

    const newPost = await Post.create({ user: userId, text, image, type: type || 'post' });
    const populatedPost = await newPost.populate('user', 'name email');
    req.io.emit('newPost', populatedPost);
    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Error creating post' });
  }
};

export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts' });
  }
};

export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });

    const post = await Post.findById(id).populate('user', 'name email');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    res.status(200).json(post);
  } catch {
    res.status(500).json({ message: 'Error fetching post' });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, image, type } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Unauthorized' });

    post.text = text || post.text;
    post.image = image || post.image;
    post.type = type || post.type;

    const updatedPost = await post.save();
    const populatedPost = await updatedPost.populate('user', 'name email');
    req.io.emit('updatePost', populatedPost);
    res.status(200).json(populatedPost);
  } catch {
    res.status(500).json({ message: 'Error updating post' });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Unauthorized' });

    await post.deleteOne();
    req.io.emit('deletePost', id);
    res.status(200).json({ message: 'Post deleted' });
  } catch {
    res.status(500).json({ message: 'Error deleting post' });
  }
};

export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const post = await Post.findById(id).populate('user', 'name email');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const alreadyLiked = post.likes.includes(userId);
    post.likes = alreadyLiked
      ? post.likes.filter((uid) => uid.toString() !== userId.toString())
      : [...post.likes, userId];

    const updatedPost = await post.save();
    const populatedPost = await updatedPost.populate('user', 'name email');
    req.io.emit('updatePost', populatedPost);

    res.status(200).json({ post: populatedPost });
  } catch {
    res.status(500).json({ message: 'Error liking post' });
  }
};
// 💬 Add comment
export const addComment = async (req, res) => {
  try {
    const { id } = req.params; // postId
    const { text } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: 'Invalid Post ID' });
    if (!text?.trim()) return res.status(400).json({ message: 'Comment cannot be empty' });

    const post = await Post.findById(id).populate('user', 'name email');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = { user: userId, text };
    post.comments.push(comment);
    await post.save();

    const populatedPost = await Post.findById(id)
      .populate('user', 'name email')
      .populate('comments.user', 'name email');

    req.io.emit('updatePost', populatedPost); // real-time update
    res.status(201).json(populatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding comment' });
  }
};

// ✏️ Update comment
export const updateComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(commentId))
      return res.status(400).json({ message: 'Invalid ID' });

    const post = await Post.findById(id).populate('user', 'name email');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.user.toString() !== userId.toString())
      return res.status(403).json({ message: 'Unauthorized' });

    comment.text = text;
    await post.save();

    const populatedPost = await Post.findById(id)
      .populate('user', 'name email')
      .populate('comments.user', 'name email');

    req.io.emit('updatePost', populatedPost);
    res.status(200).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Error updating comment' });
  }
};

// 🗑️ Delete comment
export const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(commentId))
      return res.status(400).json({ message: 'Invalid ID' });

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.user.toString() !== userId.toString())
      return res.status(403).json({ message: 'Unauthorized' });

    comment.deleteOne();
    await post.save();

    const populatedPost = await Post.findById(id)
      .populate('user', 'name email')
      .populate('comments.user', 'name email');

    req.io.emit('updatePost', populatedPost);
    res.status(200).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Error deleting comment' });
  }
};

