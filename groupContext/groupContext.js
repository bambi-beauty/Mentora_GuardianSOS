import React, { createContext, useState, useEffect } from 'react';

export const GroupsContext = createContext();

export const GroupsProvider = ({ children }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = 'http://192.168.137.1:3000/api'; 

  // Fetch all groups (Read)
  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Fetching groups from:', API_URL + '/groups');
      const response = await fetch(API_URL + '/groups');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Groups fetched:', data);
      setGroups(data);
    } catch (err) {
      console.error('❌ Fetch groups error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create a new group (Create)
  const createGroup = async (groupData) => {
    setError(null);
    try {
      console.log('🚀 Creating group at:', API_URL + '/groups');
      console.log('📤 Sending data:', groupData);
      
      const response = await fetch(API_URL + '/groups', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(groupData),
      });
      
      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create group: ${response.status} - ${errorText}`);
      }
      
      const newGroup = await response.json();
      console.log('✅ Group created:', newGroup);
      setGroups(prevGroups => [...prevGroups, newGroup]);
      return newGroup;
    } catch (err) {
      console.error('❌ Create group error:', err);
      setError(err.message);
      throw err;
    }
  };

  const updateGroup = async (groupId, updatedData) => {
    setError(null);
    try {
      console.log('✏️ Updating group:', groupId);
      const response = await fetch(`${API_URL}/groups/${groupId}`, {
        method: 'PUT',  
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update group: ${response.status}`);
      }
      
      const updatedGroup = await response.json();
      setGroups(prevGroups =>
        prevGroups.map(group => (group._id === groupId ? updatedGroup : group))
      );
      return updatedGroup;
    } catch (err) {
      console.error('❌ Update group error:', err);
      setError(err.message);
      throw err;
    }
  };

  const deleteGroup = async (groupId) => {
    setError(null);
    try {
      console.log('🗑️ Deleting group:', groupId);
      const response = await fetch(`${API_URL}/groups/${groupId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete group: ${response.status}`);
      }
      
      setGroups(prevGroups => prevGroups.filter(group => group._id !== groupId));
    } catch (err) {
      console.error('❌ Delete group error:', err);
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <GroupsContext.Provider
      value={{
        groups,
        loading,
        error,
        fetchGroups,
        createGroup,
        updateGroup,
        deleteGroup,
      }}
    >
      {children}
    </GroupsContext.Provider>
  );
};