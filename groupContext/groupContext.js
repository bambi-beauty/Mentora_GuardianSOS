import React, { createContext, useState, useContext } from 'react';
import { useUser } from '../Users/useContext';

const GroupsContext = createContext();

export const GroupsProvider = ({ children }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, token } = useUser();

  const API_BASE = 'https://baroscopical-natosha-overrigid.ngrok-free.dev/api';

  // Enhanced connection test
  const testConnection = async () => {
    try {
      console.log('🧪 Testing API connection...');
      const response = await fetch(`${API_BASE}/groups/debug`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ API Connection test:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ API Connection failed:', error);
      return { success: false, error: error.message };
    }
  };

  // Enhanced authentication test
  const testAuth = async () => {
    if (!token) {
      console.error('❌ No token available for auth test');
      return { success: false, error: 'No authentication token' };
    }

    try {
      console.log('🧪 Testing authentication...');
      const response = await fetch(`${API_BASE}/groups/debug/auth`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Auth test:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Auth test failed:', error);
      return { success: false, error: error.message };
    }
  };

  // Enhanced fetchGroups with pre-flight checks
  const fetchGroups = async (category = 'All') => {
    console.log('🔄 fetchGroups called:', { 
      category, 
      userId: user?._id, 
      hasToken: !!token,
      tokenLength: token?.length 
    });
    
    setLoading(true);
    setError(null);
    
    try {
      // Pre-flight checks
      if (!token) {
        throw new Error('No authentication token available');
      }

      if (!user) {
        throw new Error('No user data available');
      }

      const url = category === 'All' 
        ? `${API_BASE}/groups` 
        : `${API_BASE}/groups?category=${encodeURIComponent(category)}`;
      
      console.log('📡 Making request to:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        let errorDetails = null;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          errorDetails = errorData;
          console.error('❌ Server error response:', errorData);
        } catch (e) {
          const errorText = await response.text();
          console.error('❌ Error response text:', errorText);
          errorDetails = errorText;
        }
        
        const error = new Error(errorMessage);
        error.details = errorDetails;
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      console.log('✅ Groups fetched successfully:', data?.length || 0, 'groups');
      
      if (!Array.isArray(data)) {
        console.warn('⚠️ Expected array but got:', typeof data, data);
        setGroups([]);
        return [];
      }

      setGroups(data);
      return data;
    } catch (err) {
      console.error('❌ Fetch groups error:', err);
      const errorMessage = err.details?.message || err.message || 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupById = async (groupId) => {
    console.log('🔄 fetchGroupById called:', groupId);
    
    if (!groupId) {
      throw new Error('Group ID is required');
    }

    if (!token) {
      throw new Error('Authentication required');
    }

    setLoading(true);
    
    try {
      const url = `${API_BASE}/groups/${groupId}`;
      console.log('📡 Fetching group from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Group response status:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        let errorDetails = null;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          errorDetails = errorData;
          console.error('❌ Server error response:', errorData);
        } catch (e) {
          const errorText = await response.text();
          console.error('❌ Error response text:', errorText);
          errorDetails = errorText;
        }
        
        const error = new Error(errorMessage);
        error.details = errorDetails;
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      console.log('✅ Group fetched successfully:', data.name);
      console.log('📊 Group details:', {
        messages: data.messages?.length || 0,
        members: data.members,
        isMember: data.isMember
      });
      
      return data;
    } catch (err) {
      console.error('❌ Fetch group by ID error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (groupData) => {
    console.log('🔄 createGroup called:', groupData);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/groups`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      });

      console.log('📥 Create group response status:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error('❌ Create group error response:', errorData);
        } catch (e) {
          const errorText = await response.text();
          console.error('❌ Error response text:', errorText);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Group created successfully:', data.name);
      
      // Refresh groups list
      await fetchGroups();
      return data;
    } catch (err) {
      console.error('❌ Create group error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async (groupId) => {
    console.log('🔄 joinGroup called:', groupId);
    
    if (!groupId) {
      throw new Error('Group ID is required');
    }

    if (!token) {
      throw new Error('Authentication required');
    }
    
    try {
      const url = `${API_BASE}/groups/${groupId}/join`;
      console.log('📡 Joining group at:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Join group response status:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error('❌ Join group error response:', errorData);
        } catch (e) {
          const errorText = await response.text();
          console.error('❌ Error response text:', errorText);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Joined group successfully:', data.name || data.message);
      
      // Refresh groups list to update membership status
      await fetchGroups();
      return data;
    } catch (err) {
      console.error('❌ Join group error:', err);
      throw err;
    }
  };

  const leaveGroup = async (groupId) => {
    console.log('🔄 leaveGroup called:', groupId);
    
    if (!groupId) {
      throw new Error('Group ID is required');
    }

    if (!token) {
      throw new Error('Authentication required');
    }
    
    try {
      const response = await fetch(`${API_BASE}/groups/${groupId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Leave group response status:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error('❌ Leave group error response:', errorData);
        } catch (e) {
          const errorText = await response.text();
          console.error('❌ Error response text:', errorText);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Left group successfully');
      
      // Refresh groups list to update membership status
      await fetchGroups();
      return data;
    } catch (err) {
      console.error('❌ Leave group error:', err);
      throw err;
    }
  };

  const addMessage = async (groupId, messageData) => {
    console.log('🔄 addMessage called:', { groupId, messageData });
    
    if (!groupId) {
      throw new Error('Group ID is required');
    }

    if (!token) {
      throw new Error('Authentication required');
    }
    
    try {
      const url = `${API_BASE}/groups/${groupId}/messages`;
      console.log('📡 Sending message to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      console.log('📥 Add message response status:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error('❌ Add message error response:', errorData);
        } catch (e) {
          const errorText = await response.text();
          console.error('❌ Error response text:', errorText);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Message added successfully');
      return data;
    } catch (err) {
      console.error('❌ Add message error:', err);
      throw err;
    }
  };

  // Clear error state
  const clearError = () => {
    setError(null);
  };

  // Refresh groups
  const refreshGroups = () => {
    return fetchGroups();
  };

  const value = {
    // State
    groups,
    loading,
    error,
    
    // Actions
    fetchGroups,
    fetchGroupById,
    createGroup,
    joinGroup,
    leaveGroup,
    addMessage,
    
    // Utilities
    testConnection,
    testAuth,
    clearError,
    refreshGroups,
    
    // Debug info
    debugInfo: {
      user: user ? { id: user._id, email: user.email } : null,
      hasToken: !!token,
      groupsCount: groups.length,
      apiBase: API_BASE
    }
  };

  return (
    <GroupsContext.Provider value={value}>
      {children}
    </GroupsContext.Provider>
  );
};

export const useGroups = () => {
  const context = useContext(GroupsContext);
  if (!context) {
    console.error('GroupsContext is undefined. Make sure GroupsProvider is properly set up.');
    throw new Error('useGroups must be used within a GroupsProvider');
  }
  return context;
};

// Export the context for advanced use cases
export { GroupsContext };