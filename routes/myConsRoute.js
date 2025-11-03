import express from 'express';
import { 
  addContacts, 
  getContactsByUser, 
  updateContact, 
  deleteContact,
  addSingleContact 
} from '../controller/myCons.js'; 

const router = express.Router();

// ✅ CLEAR ROUTE SEPARATION
router.post('/bulk', addContacts); // POST /api/contacts/bulk (multiple contacts)
router.post('/:userId', addSingleContact); // POST /api/contacts/:userId (single contact)
router.get('/:userId', getContactsByUser); // GET /api/contacts/:userId
router.put('/:userId/:contactId', updateContact); // PUT /api/contacts/:userId/:contactId  
router.delete('/:userId/:contactId', deleteContact); // DELETE /api/contacts/:userId/:contactId

export default router;