const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Send prompt to Poppy AI API and get response
 * @param {string} prompt - The prompt to send to Poppy AI
 * @returns {Promise<Object>} - The response from Poppy AI
 */
exports.sendToPoppyAI = async (prompt) => {
  try {
    // Construct URL with parameters from environment variables
    const conversationId = process.env.POPPY_CONVERSATION_ID || 'ZErtx7g3xmS7yjIbgyer';
    
    // Construct the API URL
    const poppyApiUrl = `https://api.getpoppy.ai/api/conversation/${conversationId}`;
    
    // Build query parameters
    const params = {
      board_id: process.env.POPPY_BOARD_ID || 'restless-wood-ZCv2D',
      chat_id: process.env.POPPY_CHAT_ID || 'chatNode-floral-earth-Y3ZNf',
      model: process.env.POPPY_MODEL || 'claude-3-7-sonnet-20250219',
      api_key: process.env.POPPY_API_KEY || 'gp_Kind_Turtle_WhTIkDxty4NUpEOnsN90y0awHQm1',
      prompt: prompt,
      save_history: process.env.POPPY_SAVE_HISTORY || 'true',
      user: process.env.POPPY_USER || 'abhijeetVarma',
      source: process.env.POPPY_SOURCE || ''
    };
    
    // Log the request (with API key redacted for security)
    const logParams = {...params, api_key: 'REDACTED'};
    console.log(`Sending request to Poppy AI: ${poppyApiUrl} with params:`, logParams);
    
    // Make request to Poppy AI
    const response = await axios.get(poppyApiUrl, { params });
    
    console.log('Received response from Poppy AI');
    return response.data;
  } catch (error) {
    console.error('Error sending request to Poppy AI:', error.message);
    
    // Add more detailed error info if available
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    throw new Error(`Failed to communicate with Poppy AI: ${error.message}`);
  }
};
