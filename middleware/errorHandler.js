/**
 * Global error handling middleware
 */
module.exports = (err, req, res, next) => {
  console.error('Error caught in middleware:', err);
  
  // Determine HTTP status code
  let statusCode = err.statusCode || 500;
  
  // Format error message
  const errorResponse = {
    error: {
      message: err.message || 'An unexpected error occurred',
      type: err.type || 'server_error',
      code: err.code || 'internal_server_error'
    }
  };
  
  // Special handling for Axios errors
  if (err.isAxiosError) {
    statusCode = err.response?.status || 500;
    
    // Include additional details from the Poppy AI response if available
    if (err.response?.data) {
      errorResponse.error.details = err.response.data;
    }
    
    errorResponse.error.message = 'Error communicating with Poppy AI: ' + errorResponse.error.message;
  }
  
  // Log the complete error for debugging
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    statusCode,
    responseBody: errorResponse
  });
  
  return res.status(statusCode).json(errorResponse);
};
