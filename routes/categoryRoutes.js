import express from 'express';
import {
   getCategories,
   getCategoryBySlug,
   getAllCategories,
   createCategory,
   updateCategory,
   deleteCategory,
   toggleCategoryStatus,
   reorderCategories,
} from '../controller/categoryController.js';
import auth from '../middleware/authentication.js';
import restrictTo from '../middleware/authorization.js';

const router = express.Router();

// Public routes
router.get('/', getCategories);

// Admin routes (protected) - must be before /:slug to avoid conflicts
router.get('/admin/all', auth, restrictTo('admin'), getAllCategories);
router.post('/admin/create', auth, restrictTo('admin'), createCategory);
router.put('/admin/:id', auth, restrictTo('admin'), updateCategory);
router.delete('/admin/:id', auth, restrictTo('admin'), deleteCategory);
router.patch(
   '/admin/:id/toggle',
   auth,
   restrictTo('admin'),
   toggleCategoryStatus
);
router.patch('/admin/reorder', auth, restrictTo('admin'), reorderCategories);

// Public route with param (must be last to avoid conflicts)
router.get('/:slug', getCategoryBySlug);

export default router;
