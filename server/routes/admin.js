/**
 * Admin Routes — /api/v1/admin
 */

const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getStats,
  getUsers,
  getAllListings,
  toggleListingActive,
  updateUserRole,
} = require('../controllers/adminController');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/listings', getAllListings);
router.patch('/listings/:id/toggle', toggleListingActive);
router.patch('/users/:id/role', updateUserRole);

module.exports = router;
