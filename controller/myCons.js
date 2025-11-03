import Contact from '../model/contactsModel.js';

export const addContacts = async (req, res) => {
  const { userId, contacts } = req.body;

  if (!userId || !Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({
      message: 'Please provide userId and at least 1 contact',
    });
  }

  try {
    const contactsToInsert = contacts.map(contact => {
      if (!contact.name || !contact.phoneNumber) {
        throw new Error("Each contact must have a name and phoneNumber");
      }
      return {
        user: userId,
        name: contact.name.trim(),
        phoneNumber: contact.phoneNumber.trim(),
        relationship: contact.relationship?.trim() || 'Other',
        isEmergency: contact.isEmergency || false
      };
    });

    const savedContacts = await Contact.insertMany(contactsToInsert);

    res.status(201).json({
      message: 'Contacts saved successfully',
      contacts: savedContacts,
    });
  } catch (error) {
    console.error('❌ Error saving contacts:', error.message);
    res.status(500).json({ message: 'Failed to save contacts', error: error.message });
  }
};

// ✅ FIXED - Single contact creation
export const addSingleContact = async (req, res) => {
  const { userId } = req.params;
  let contactData = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    // Handle both array and object input
    if (Array.isArray(contactData)) {
      contactData = contactData[0]; // Take first element if array
    }

    if (!contactData.name || !contactData.phoneNumber) {
      return res.status(400).json({ message: 'Name and phone number are required' });
    }

    const contact = new Contact({
      user: userId,
      name: contactData.name.trim(),
      phoneNumber: contactData.phoneNumber.trim(),
      relationship: contactData.relationship?.trim() || 'Other',
      isEmergency: contactData.isEmergency || false
    });

    const savedContact = await contact.save();

    res.status(201).json({
      message: 'Contact saved successfully',
      contact: savedContact,
    });
  } catch (error) {
    console.error('❌ Error saving contact:', error.message);
    res.status(500).json({ message: 'Failed to save contact', error: error.message });
  }
};

export const getContactsByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const contacts = await Contact.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json({ 
      message: 'Contacts fetched successfully',
      contacts 
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ message: 'Failed to fetch contacts', error: error.message });
  }
};

// ✅ FIXED - Update contact
export const updateContact = async (req, res) => {
  try {
    const { userId, contactId } = req.params;
    const updates = req.body;

    if (!contactId || !userId) {
      return res.status(400).json({ message: 'Contact ID and User ID are required' });
    }

    // Find contact by ID and user ID to ensure ownership
    const contact = await Contact.findOne({ _id: contactId, user: userId });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    // Update contact fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && updates[key] !== null) {
        contact[key] = updates[key];
      }
    });

    await contact.save();

    res.json({
      message: 'Contact updated successfully',
      contact: contact
    });
  } catch (err) {
    console.error('Update contact error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ FIXED - Delete contact
export const deleteContact = async (req, res) => {
  try {
    const { userId, contactId } = req.params;

    if (!contactId || !userId) {
      return res.status(400).json({ message: 'Contact ID and User ID are required' });
    }

    const contact = await Contact.findOneAndDelete({ _id: contactId, user: userId });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json({ 
      message: 'Contact deleted successfully',
      deletedContact: contact 
    });
  } catch (err) {
    console.error('Delete contact error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};