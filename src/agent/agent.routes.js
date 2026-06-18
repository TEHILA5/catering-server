const express = require('express');
const router = express.Router();
const agentController = require('./agent.controller');
const { optionalAuth } = require('../middlewares/auth.middleware');

router.post('/chat', optionalAuth, agentController.chat);

module.exports = router;
