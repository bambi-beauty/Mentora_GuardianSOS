import Contact from '../model/contactsModel.js';  // Adjust path as needed


export const addContacts = async (req, res) => {
  const { userId, contacts } = req.body;

  // console.log("🔍 Raw req.body:", req.body);
  // console.log("👤 userId:", userId);
  // console.log("📇 contacts:", contacts);
  // console.log("✅ contacts isArray:", Array.isArray(contacts));
  // console.log("🔢 contacts length:", contacts?.length);

  if (!userId || !Array.isArray(contacts) || contacts.length < 2) {
    return res.status(400).json({
      message: 'Please provide userId and at least 2 contacts',
      debug: {
        userId,
        contacts,
        isArray: Array.isArray(contacts),
        count: contacts?.length,
      },
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
        relationship: contact.relationship?.trim() || '',
      };
    });

    const savedContacts = await Contact.insertMany(contactsToInsert);

    // console.log(`✅ Saved ${savedContacts.length} contacts for user ${userId}`);

    res.status(201).json({
      message: 'Contacts saved successfully',
      contacts: savedContacts,
    });
  } catch (error) {
    console.error('❌ Error saving contacts:', error.message);
    res.status(500).json({ message: 'Failed to save contacts', error: error.message });
  }
};

export const getContactsByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const contacts = await Contact.find({ user: userId });
    res.status(200).json({ contacts });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ message: 'Failed to fetch contacts' });
  }
};

export const updateContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    const contact = await EmergencyContact.findOne({ _id: contactId, user: userId });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    Object.assign(contact, updates);
    await contact.save();

    return res.json(contact);
  } catch (err) {
    console.error('Update contact error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const deleteContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const userId = req.user._id;

    const contact = await EmergencyContact.findOneAndDelete({ _id: contactId, user: userId });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    return res.json({ message: 'Contact deleted successfully' });
  } catch (err) {
    console.error('Delete contact error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
