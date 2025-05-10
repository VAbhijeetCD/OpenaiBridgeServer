const express = require('express');
const completionsController = require('../controllers/completionsController');

const router = express.Router();

// OpenAI chat completions API endpoint
router.post('/v1/chat/completions', completionsController.createChatCompletion);

// OpenAI completions API endpoint (legacy)
router.post('/v1/completions', completionsController.createCompletion);

// Catch-all for any other OpenAI endpoints
router.all('/v1/:path(*)', (req, res) => {
  res.status(501).json({
    error: {
      message: 'This endpoint is not implemented in the proxy server',
      type: 'not_implemented',
      code: 'not_implemented'
    }
  });
});

module.exports = router;
