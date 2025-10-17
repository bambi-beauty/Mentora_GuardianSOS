import express from 'express';
import { addContacts, getContactsByUser } from '../controller/myCons.js'; 

const router = express.Router();

router.post('/contacts', addContacts);
router.get('/:userId', getContactsByUser);

export default router;
