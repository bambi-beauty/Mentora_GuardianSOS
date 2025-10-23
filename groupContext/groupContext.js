import React, { createContext, useState, useEffect } from 'react';


export const GroupsContext = createContext();

export const GroupsProvider = ({ children }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = 'http//192.168.50.236'; 

  // Fetch all groups (Read)
  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data = await response.json();
      setGroups(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create a new group (Create)
  const createGroup = async (groupData) => {
    setError(null);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData),
      });
      if (!response.ok) throw new Error('Failed to create group');
      const newGroup = await response.json();
      setGroups(prevGroups => [...prevGroups, newGroup]);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateGroup = async (groupId, updatedData) => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/${groupId}`, {
        method: 'PUT',  
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) throw new Error('Failed to update group');
      const updatedGroup = await response.json();

      setGroups(prevGroups =>
        prevGroups.map(group => (group._id === groupId ? updatedGroup : group))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete a group (Delete)
  const deleteGroup = async (groupId) => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/${groupId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete group');
      setGroups(prevGroups => prevGroups.filter(group => group._id !== groupId));
    } catch (err) {
      setError(err.message);
    }
  };

  // Load groups on component mount
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
