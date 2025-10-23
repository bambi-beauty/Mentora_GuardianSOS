import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { io } from 'socket.io-client';
import { useUser } from '../Users/useContext';

const PostContext = createContext();

export const PostProvider = ({ children }) => {
  const { token } = useUser();
  const backendBaseUrl = 'https://thisprojectbackend1-1.onrender.com'; // make sure this is reachable
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [socket, setSocket] = useState(null);

  // Initialize Socket.IO
  useEffect(() => {
    const s = io(backendBaseUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      auth: { token }, // optional if backend requires socket auth
    });
    setSocket(s);

    s.on('connect', () => console.log('🟢 Connected to Socket.IO server'));
    s.on('disconnect', () => console.log('🔴 Disconnected from Socket.IO'));

    // Real-time listeners
    s.on('newPost', (post) => setPosts((prev) => [post, ...prev]));
    s.on('updatePost', (updated) =>
      setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)))
    );
    s.on('deletePost', (id) =>
      setPosts((prev) => prev.filter((p) => p._id !== id))
    );

    return () => s.disconnect();
  }, [token]);

  // Fetch all posts
  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch(`${backendBaseUrl}/api/posts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json();
      if (res.ok) setPosts(data);
      else Alert.alert('Error', data.message || 'Failed to fetch posts');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Create post
  const createPost = async (text, image = null, type = 'post') => {
    if (!text.trim() && !image) return Alert.alert('Empty post');

    try {
      const res = await fetch(`${backendBaseUrl}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text, image, type }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create post');

      // ✅ Let Socket.IO handle adding post to state
      return data;
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  // Update post
  const updatePost = async (postId, text, image = null) => {
    try {
      const res = await fetch(`${backendBaseUrl}/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text, image }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update post');

      // ✅ Socket.IO will handle state update
      return data;
    } catch (err) {
      Alert.alert('Update Error', err.message);
    }
  };

  // Delete post
  const deletePost = async (postId) => {
    try {
      const res = await fetch(`${backendBaseUrl}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete post');

      // ✅ Socket.IO will handle removing post
      return true;
    } catch (err) {
      Alert.alert('Delete Error', err.message);
      return false;
    }
  };

  // Like / Unlike post
  const likePost = async (postId) => {
    try {
      const res = await fetch(`${backendBaseUrl}/api/posts/${postId}/like`, {
        method: 'PUT', // ⚠️ Backend expects PUT
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to like post');

      // ✅ Update post in state
      setPosts((prev) =>
        prev.map((p) => (p._id === data.post._id ? data.post : p))
      );
    } catch (err) {
      console.error('Like error:', err.message);
    }
  };

  // Add comment
  const addComment = async (postId, text) => {
    if (!text.trim()) return Alert.alert('Empty comment');

    try {
      const res = await fetch(`${backendBaseUrl}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add comment');

      // ✅ Socket.IO handles state update
      return data;
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  // Update comment
  const updateComment = async (postId, commentId, text) => {
    try {
      const res = await fetch(`${backendBaseUrl}/api/posts/${postId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update comment');

      // ✅ Socket.IO handles state update
      return data;
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  // Delete comment
  const deleteComment = async (postId, commentId) => {
    try {
      const res = await fetch(`${backendBaseUrl}/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete comment');

      // ✅ Socket.IO handles state update
      return data;
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  useEffect(() => {
    if (token) fetchPosts();
  }, [token]);

  return (
    <PostContext.Provider
      value={{
        posts,
        loadingPosts,
        createPost,
        fetchPosts,
        likePost,
        updatePost,
        deletePost,
        addComment,
        updateComment,
        deleteComment,
      }}
    >
      {children}
    </PostContext.Provider>
  );
};

export const usePosts = () => useContext(PostContext);
