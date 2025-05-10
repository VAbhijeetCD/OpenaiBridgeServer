const express = require('express');
const completionsController = require('../controllers/completionsController');

const router = express.Router();

// OpenAI chat completions API endpoint
router.post('/v1/chat/completions', completionsController.createChatCompletion);

// OpenAI completions API endpoint (legacy)
router.post('/v1/completions', completionsController.createCompletion);

module.exports = router;
