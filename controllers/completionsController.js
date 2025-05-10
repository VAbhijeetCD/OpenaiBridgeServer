const requestParser = require("../utils/requestParser");
const responseFormatter = require("../utils/responseFormatter");
const poppyService = require("../services/poppyService");

/**
 * Handle chat completions API requests
 */
exports.createChatCompletion = async (req, res, next) => {
  try {
    console.log(
      "Received OpenAI chat completions request:",
      JSON.stringify(req.body),
    );

    // Extract prompt from the OpenAI chat completions format
    const prompt = requestParser.extractPromptFromChatRequest(req.body);

    if (!prompt) {
      return res.status(400).json({
        error: {
          message: "No valid messages found in the request",
          type: "invalid_request_error",
          param: "messages",
          code: "invalid_messages",
        },
      });
    }

    // Forward to Poppy AI API
    const poppyResponse = await poppyService.sendToPoppyAI(prompt);

    // Format Poppy AI response to match OpenAI format
    const formattedResponse = responseFormatter.formatChatCompletionResponse(
      poppyResponse,
      req.body.model || "gpt-3.5-turbo",
    );

    console.log("Response", formattedResponse);

    console.log(
      "Sending response back to client",
      JSON.stringify(formattedResponse),
    );
    res.json(formattedResponse);
  } catch (error) {
    console.error("Error in chat completions:", error);
    next(error);
  }
};

/**
 * Handle completions API requests (legacy)
 */
exports.createCompletion = async (req, res, next) => {
  try {
    console.log(
      "Received OpenAI completions request:",
      JSON.stringify(req.body),
    );

    // Extract prompt from the OpenAI completions format
    const prompt = requestParser.extractPromptFromCompletionRequest(req.body);

    if (!prompt) {
      return res.status(400).json({
        error: {
          message: "No valid prompt found in the request",
          type: "invalid_request_error",
          param: "prompt",
          code: "invalid_prompt",
        },
      });
    }

    // Forward to Poppy AI API
    const poppyResponse = await poppyService.sendToPoppyAI(prompt);

    // Format Poppy AI response to match OpenAI format
    const formattedResponse = responseFormatter.formatCompletionResponse(
      poppyResponse,
      req.body.model || "text-davinci-003",
    );

    console.log("Sending response back to client");
    res.json(formattedResponse);
  } catch (error) {
    console.error("Error in completions:", error);
    next(error);
  }
};
