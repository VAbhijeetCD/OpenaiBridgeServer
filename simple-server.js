const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(bodyParser.json());

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'OpenAI to Poppy AI Proxy Server' });
});

// OpenAI completions API endpoint (legacy)
app.post('/v1/completions', async (req, res) => {
  try {
    console.log('Received OpenAI completions request:', JSON.stringify(req.body));
    
    // Extract prompt from the OpenAI completions format
    let prompt = null;
    
    // Handle both string and array prompts
    if (req.body && req.body.prompt) {
      if (typeof req.body.prompt === 'string') {
        prompt = req.body.prompt.trim();
      } else if (Array.isArray(req.body.prompt)) {
        prompt = req.body.prompt.join('\n\n').trim();
      }
    }
    
    if (!prompt) {
      return res.status(400).json({
        error: {
          message: 'No valid prompt found in the request',
          type: 'invalid_request_error',
          param: 'prompt',
          code: 'invalid_prompt'
        }
      });
    }
    
    // Forward to Poppy AI API
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
    const poppyResponse = response.data;
    
    // Format Poppy AI response to match OpenAI format
    // Generate a random ID for the completion
    function generateRandomString(length) {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
    }
    
    function calculateApproximateTokens(text) {
      if (!text) return 0;
      // Very rough approximation: 1 token ≈ 4 characters
      return Math.ceil(text.length / 4);
    }
    
    const id = `cmpl-${generateRandomString(29)}`;
    
    // Current timestamp in seconds
    const created = Math.floor(Date.now() / 1000);
    
    // Format the response to match OpenAI's completion response format
    const formattedResponse = {
      id,
      object: 'text_completion',
      created,
      model: req.body.model || 'text-davinci-003',
      choices: [
        {
          text: poppyResponse.text,
          index: 0,
          logprobs: null,
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: calculateApproximateTokens(poppyResponse.prompt || ''),
        completion_tokens: calculateApproximateTokens(poppyResponse.text),
        total_tokens: calculateApproximateTokens((poppyResponse.prompt || '') + poppyResponse.text),
      },
    };
    
    console.log('Sending response back to client');
    res.json(formattedResponse);
  } catch (error) {
    console.error('Error in completions:', error);
    
    // Determine HTTP status code
    let statusCode = 500;
    
    // Format error message
    const errorResponse = {
      error: {
        message: error.message || 'An unexpected error occurred',
        type: error.type || 'server_error',
        code: error.code || 'internal_server_error'
      }
    };
    
    // Special handling for Axios errors
    if (error.isAxiosError) {
      statusCode = error.response?.status || 500;
      
      // Include additional details from the Poppy AI response if available
      if (error.response?.data) {
        errorResponse.error.details = error.response.data;
      }
      
      errorResponse.error.message = 'Error communicating with Poppy AI: ' + errorResponse.error.message;
    }
    
    res.status(statusCode).json(errorResponse);
  }
});

// OpenAI chat completions API endpoint
app.post('/v1/chat/completions', async (req, res) => {
  try {
    console.log('Received OpenAI chat completions request:', JSON.stringify(req.body));
    
    // Extract prompt from the OpenAI chat completions format
    let prompt = null;
    
    if (req.body && req.body.messages && Array.isArray(req.body.messages)) {
      // Extract all user messages
      const userMessages = req.body.messages
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content)
        .filter(content => content && typeof content === 'string');
      
      // Extract system messages if available
      const systemMessages = req.body.messages
        .filter(msg => msg.role === 'system')
        .map(msg => msg.content)
        .filter(content => content && typeof content === 'string');
      
      // If there are no user messages, return null
      if (userMessages.length === 0) {
        return res.status(400).json({
          error: {
            message: 'No valid messages found in the request',
            type: 'invalid_request_error',
            param: 'messages',
            code: 'invalid_messages'
          }
        });
      }
      
      // Combine system and user messages into a meaningful prompt
      let fullPrompt = '';
      
      // Add system messages as context/instructions
      if (systemMessages.length > 0) {
        fullPrompt += `Instructions: ${systemMessages.join(' ')}\n\n`;
      }
      
      // Add all user messages
      fullPrompt += userMessages.join('\n\n');
      
      prompt = fullPrompt.trim();
    }
    
    if (!prompt) {
      return res.status(400).json({
        error: {
          message: 'No valid messages found in the request',
          type: 'invalid_request_error',
          param: 'messages',
          code: 'invalid_messages'
        }
      });
    }
    
    // Forward to Poppy AI API
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
    const poppyResponse = response.data;
    
    // Format Poppy AI response to match OpenAI format
    // Generate a random ID for the completion
    function generateRandomString(length) {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
    }
    
    function calculateApproximateTokens(text) {
      if (!text) return 0;
      // Very rough approximation: 1 token ≈ 4 characters
      return Math.ceil(text.length / 4);
    }
    
    const id = `chatcmpl-${generateRandomString(29)}`;
    
    // Current timestamp in seconds
    const created = Math.floor(Date.now() / 1000);
    
    // Format the response to match OpenAI's chat completion response format
    const formattedResponse = {
      id,
      object: 'chat.completion',
      created,
      model: req.body.model || 'gpt-3.5-turbo',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: poppyResponse.text,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: calculateApproximateTokens(poppyResponse.prompt || ''),
        completion_tokens: calculateApproximateTokens(poppyResponse.text),
        total_tokens: calculateApproximateTokens((poppyResponse.prompt || '') + poppyResponse.text),
      },
    };
    
    console.log('Sending response back to client');
    res.json(formattedResponse);
  } catch (error) {
    console.error('Error in chat completions:', error);
    
    // Determine HTTP status code
    let statusCode = 500;
    
    // Format error message
    const errorResponse = {
      error: {
        message: error.message || 'An unexpected error occurred',
        type: error.type || 'server_error',
        code: error.code || 'internal_server_error'
      }
    };
    
    // Special handling for Axios errors
    if (error.isAxiosError) {
      statusCode = error.response?.status || 500;
      
      // Include additional details from the Poppy AI response if available
      if (error.response?.data) {
        errorResponse.error.details = error.response.data;
      }
      
      errorResponse.error.message = 'Error communicating with Poppy AI: ' + errorResponse.error.message;
    }
    
    res.status(statusCode).json(errorResponse);
  }
});

// Simple error handling
app.use((err, req, res, next) => {
  console.error('Error caught in middleware:', err);
  res.status(500).json({
    error: {
      message: err.message || 'An unexpected error occurred',
      type: 'server_error',
      code: 'internal_server_error'
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});