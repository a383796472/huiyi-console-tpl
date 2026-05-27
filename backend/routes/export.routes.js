const express = require('express');
const router = express.Router();
const exportController = require('../controllers/export.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/products', verifyToken, exportController.exportProducts);
router.get('/users', verifyToken, requireRole('super_admin'), exportController.exportUsers);

module.exports = router;
