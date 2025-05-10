/**
 * Extract prompt from OpenAI chat completions API request
 * @param {Object} requestBody - The request body from the OpenAI chat completions API
 * @returns {string|null} - The extracted prompt or null if not found
 */
exports.extractPromptFromChatRequest = (requestBody) => {
  if (!requestBody || !requestBody.messages || !Array.isArray(requestBody.messages) || requestBody.messages.length === 0) {
    return null;
  }

  try {
    // Extract all user messages
    const userMessages = requestBody.messages
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .filter(content => content && typeof content === 'string');
    
    // Extract system messages if available
    const systemMessages = requestBody.messages
      .filter(msg => msg.role === 'system')
      .map(msg => msg.content)
      .filter(content => content && typeof content === 'string');
    
    // If there are no user messages, return null
    if (userMessages.length === 0) {
      return null;
    }
    
    // Combine system and user messages into a meaningful prompt
    let fullPrompt = '';
    
    // Add system messages as context/instructions
    if (systemMessages.length > 0) {
      fullPrompt += `Instructions: ${systemMessages.join(' ')}\n\n`;
    }
    
    // Add all user messages
    fullPrompt += userMessages.join('\n\n');
    
    return fullPrompt.trim();
  } catch (error) {
    console.error('Error extracting prompt from chat request:', error);
    return null;
  }
};

/**
 * Extract prompt from OpenAI completions API request (legacy format)
 * @param {Object} requestBody - The request body from the OpenAI completions API
 * @returns {string|null} - The extracted prompt or null if not found
 */
exports.extractPromptFromCompletionRequest = (requestBody) => {
  if (!requestBody || !requestBody.prompt) {
    return null;
  }

  try {
    // Handle both string and array prompts
    if (typeof requestBody.prompt === 'string') {
      return requestBody.prompt.trim();
    } else if (Array.isArray(requestBody.prompt)) {
      return requestBody.prompt.join('\n\n').trim();
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting prompt from completion request:', error);
    return null;
  }
};
