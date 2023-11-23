// functions/postEndpoint.js
exports.handler = async function (event, context) {
    try {
      // Parse JSON data from the request body
      const requestData = JSON.parse(event.body);
  
      // Perform actions with the received data
      // ...
  
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'POST request received successfully', data: requestData }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
      };
    }
  };
  