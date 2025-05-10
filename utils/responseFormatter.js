/**
 * Format Poppy AI response to match OpenAI chat completions API response
 * @param {Object} poppyResponse - The response from Poppy AI
 * @param {string} model - The model name to include in the response
 * @returns {Object} - The formatted response matching OpenAI structure
 */
exports.formatChatCompletionResponse = (poppyResponse, model) => {
  try {
    // Check if we received a valid response from Poppy
    if (!poppyResponse || !poppyResponse.text) {
      throw new Error('Invalid response received from Poppy AI');
    }
    
    // Generate a random ID for the completion
    const id = `chatcmpl-${generateRandomString(29)}`;
    
    // Current timestamp in seconds
    const created = Math.floor(Date.now() / 1000);
    
    // Format the response to match OpenAI's chat completion response format
    return {
      id,
      object: 'chat.completion',
      created,
      model,
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
  } catch (error) {
    console.error('Error formatting chat completion response:', error);
    throw error;
  }
};

/**
 * Format Poppy AI response to match OpenAI completions API response (legacy)
 * @param {Object} poppyResponse - The response from Poppy AI
 * @param {string} model - The model name to include in the response
 * @returns {Object} - The formatted response matching OpenAI structure
 */
exports.formatCompletionResponse = (poppyResponse, model) => {
  try {
    // Check if we received a valid response from Poppy
    if (!poppyResponse || !poppyResponse.text) {
      throw new Error('Invalid response received from Poppy AI');
    }
    
    // Generate a random ID for the completion
    const id = `cmpl-${generateRandomString(29)}`;
    
    // Current timestamp in seconds
    const created = Math.floor(Date.now() / 1000);
    
    // Format the response to match OpenAI's completion response format
    return {
      id,
      object: 'text_completion',
      created,
      model,
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
  } catch (error) {
    console.error('Error formatting completion response:', error);
    throw error;
  }
};

/**
 * Generate a random string of specified length
 * @param {number} length - The length of the random string
 * @returns {string} - A random string
 */
function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * Calculate an approximate token count for a text string
 * This is a very rough approximation - tokens are typically ~4 characters for English text
 * @param {string} text - The text to calculate tokens for
 * @returns {number} - The approximate token count
 */
function calculateApproximateTokens(text) {
  if (!text) return 0;
  // Very rough approximation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}
