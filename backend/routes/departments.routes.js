const express = require('express');
const router = express.Router();
const departmentsController = require('../controllers/departments.controller');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, departmentsController.getDepartments);

module.exports = router;
