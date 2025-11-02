// ContactsContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const ContactsContext = createContext();

export const ContactsProvider = ({ children }) => {
  const [savedContacts, setSavedContacts] = useState([]);
  const [contactCount, setContactCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Relationship options
  const relationshipOptions = [
    'Parent',
    'Sibling', 
    'Spouse',
    'Friend',
    'Colleague',
    'Other'
  ];

  // Load contacts from storage
  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const stored = await AsyncStorage.getItem('userContacts');
      if (stored) {
        const localContacts = JSON.parse(stored);
        setSavedContacts(localContacts);
        setContactCount(localContacts.length);
        console.log('📱 Loaded contacts from storage:', localContacts.length);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const saveContactsToStorage = async (contacts) => {
    try {
      await AsyncStorage.setItem('userContacts', JSON.stringify(contacts));
      console.log('💾 Saved contacts to storage:', contacts.length);
    } catch (error) {
      console.error('Error saving contacts:', error);
      throw error;
    }
  };

  // Add contact - LOCAL ONLY (no backend dependency)
  const addContact = async (contact) => {
    try {
      const newContact = {
        ...contact,
        id: Date.now().toString(), // Local ID
        relationship: contact.relationship || 'Other',
        isEmergency: contact.isEmergency || false,
        dateAdded: new Date().toISOString()
      };

      const updatedContacts = [...savedContacts, newContact];
      setSavedContacts(updatedContacts);
      setContactCount(updatedContacts.length);
      await saveContactsToStorage(updatedContacts);

      console.log('✅ Contact added locally:', newContact.name);
      return newContact;
    } catch (error) {
      console.error('Error adding contact:', error);
      Alert.alert('Error', 'Failed to add contact');
      throw error;
    }
  };

  // Remove contact - LOCAL ONLY
  const removeContact = async (id) => {
    try {
      const contactToRemove = savedContacts.find(c => c.id === id);
      const updatedContacts = savedContacts.filter(contact => contact.id !== id);
      
      setSavedContacts(updatedContacts);
      setContactCount(updatedContacts.length);
      await saveContactsToStorage(updatedContacts);

      console.log('🗑️ Contact removed locally:', contactToRemove?.name);
    } catch (error) {
      console.error('Error removing contact:', error);
      Alert.alert('Error', 'Failed to remove contact');
      throw error;
    }
  };

  // Update contact - LOCAL ONLY
  const updateContact = async (id, updatedFields) => {
    try {
      const updatedContacts = savedContacts.map(contact =>
        contact.id === id ? { ...contact, ...updatedFields } : contact
      );
      
      setSavedContacts(updatedContacts);
      setContactCount(updatedContacts.length);
      await saveContactsToStorage(updatedContacts);

      console.log('✏️ Contact updated locally:', id);
    } catch (error) {
      console.error('Error updating contact:', error);
      Alert.alert('Error', 'Failed to update contact');
      throw error;
    }
  };

  const refreshContacts = () => {
    loadContacts();
  };

  // Get contact statistics
  const getContactStats = () => {
    const total = savedContacts.length;
    const emergency = savedContacts.filter(c => c.isEmergency).length;
    const regular = total - emergency;

    return {
      total,
      emergency,
      regular
    };
  };

  // Helper function to normalize phone numbers
  const normalizePhone = (phone) => {
    return (phone || '').replace(/[^0-9+]/g, '');
  };

  // Check if phone already exists
  const isDuplicatePhone = (phone, excludeId = null) => {
    const normalizedPhone = normalizePhone(phone);
    return savedContacts.some(contact => 
      contact.id !== excludeId && normalizePhone(contact.phone) === normalizedPhone
    );
  };

  return (
    <ContactsContext.Provider
      value={{
        savedContacts,
        contactCount,
        relationshipOptions,
        addContact,
        removeContact,
        updateContact,
        refreshContacts,
        getContactStats,
        isDuplicatePhone,
        normalizePhone,
      }}
    >
      {children}
    </ContactsContext.Provider>
  );
};

export const useContacts = () => {
  const context = useContext(ContactsContext);
  if (!context) {
    throw new Error('useContacts must be used within a ContactsProvider');
  }
  return context;
};