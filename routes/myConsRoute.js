import express from 'express';
import { 
  addContacts, 
  getContactsByUser, 
  updateContact, 
  deleteContact,
  addSingleContact 
} from '../controller/myCons.js'; 

const router = express.Router();

// ✅ CORRECTED ROUTES - Match your frontend expectations
router.post('/', addContacts); // POST /api/contacts (bulk)
router.post('/:userId', addSingleContact); // POST /api/contacts/:userId (single)
router.get('/:userId', getContactsByUser); // GET /api/contacts/:userId
router.put('/:userId/:contactId', updateContact); // PUT /api/contacts/:userId/:contactId  
router.delete('/:userId/:contactId', deleteContact); // DELETE /api/contacts/:userId/:contactId

export default router;