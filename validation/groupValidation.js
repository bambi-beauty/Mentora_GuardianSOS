import { body, param, query } from 'express-validator';

export const validateCreateGroup = [
  body('name')
    .trim()
    .notEmpty().withMessage('Group name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Group name must be between 2 and 50 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  
  body('category')
    .isIn(['Residential', 'Business', 'Campus', 'Park', 'Other'])
    .withMessage('Invalid category')
];

export const validateAddMessage = [
  body('text')
    .trim()
    .notEmpty().withMessage('Message text is required')
    .isLength({ max: 1000 }).withMessage('Message cannot exceed 1000 characters'),
  
  body('type')
    .optional()
    .isIn(['text', 'alert', 'announcement'])
    .withMessage('Invalid message type')
];

export const validateGroupId = [
  param('id')
    .isMongoId().withMessage('Invalid group ID')
];

export const validateCategoryFilter = [
  query('category')
    .optional()
    .isIn(['All', 'Residential', 'Business', 'Campus', 'Park', 'Other'])
    .withMessage('Invalid category filter')
];