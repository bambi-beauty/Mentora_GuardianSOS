// ContactsContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from "../Users/useContext";

const ContactsContext = createContext();

export const useContacts = () => {
  const context = useContext(ContactsContext);
  if (!context) {
    throw new Error('useContacts must be used within a ContactsProvider');
  }
  return context;
};

export const ContactsProvider = ({ children }) => {
  const [savedContacts, setSavedContacts] = useState([]);
  const STORAGE_KEY = '@saved_contacts';

  // Load saved contacts on app start
  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) setSavedContacts(JSON.parse(json));
    } catch (e) {
      console.warn('Failed to load saved contacts', e);
    }
  };

  const saveContacts = async (contacts) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    } catch (e) {
      console.warn('Failed to save contacts', e);
    }
  };

  // Add a new contact
  const addContact = (contact) => {
    const newContact = {
      id: Date.now().toString(),
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
      isEmergency: true
    };

    const updatedContacts = [newContact, ...savedContacts];
    setSavedContacts(updatedContacts);
    saveContacts(updatedContacts);
    return newContact;
  };

  // Add multiple emergency contacts
  const addEmergencyContacts = (emergencyContacts) => {
    const newContacts = emergencyContacts.map(contact => ({
      id: `${Date.now()}-${contact.phone}`,
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
      isEmergency: true
    }));

    const updatedContacts = [...newContacts, ...savedContacts];
    setSavedContacts(updatedContacts);
    saveContacts(updatedContacts);
    return newContacts;
  };

  // Remove contact
  const removeContact = (id) => {
    const updatedContacts = savedContacts.filter(contact => contact.id !== id);
    setSavedContacts(updatedContacts);
    saveContacts(updatedContacts);
  };

  const value = {
    savedContacts,
    addContact,
    addEmergencyContacts,
    removeContact,
    loadContacts,
    refreshContacts: loadContacts
  };

  return (
    <ContactsContext.Provider value={value}>
      {children}
    </ContactsContext.Provider>
  );
};