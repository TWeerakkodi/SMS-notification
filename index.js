// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const https = require('follow-redirects').https;
const mongoose = require('mongoose');

// Create Express app
const app = express();
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define a schema for SMS
const smsSchema = new mongoose.Schema({
  phoneNumber: String,
  message: String,
});

// Define a model for SMS using the schema
const SMS = mongoose.model('SMS', smsSchema);

// POST route to send SMS
app.post('/send-sms', async (req, res) => {
  // Extract the recipient's phone number and message from the request body
  const { phoneNumber, message } = req.body;

  // Save the SMS details to MongoDB
  const sms = new SMS({
    phoneNumber,
    message,
  });
  await sms.save();

  // Infobip API options
  const options = {
    method: 'POST',
    hostname: 'yrm6dp.api.infobip.com',
    path: '/sms/2/text/advanced',
    headers: {
      'Authorization':'', // Replace with your Infobip API key
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    maxRedirects: 20
  };

  // Create the HTTP request to Infobip API
  const apiRequest = https.request(options, (apiResponse) => {
    const chunks = [];

    apiResponse.on('data', (chunk) => {
      chunks.push(chunk);
    });

    apiResponse.on('end', (chunk) => {
      const body = Buffer.concat(chunks);
      console.log(body.toString());
      // Handle the API response or send a response to the Flutter app
      res.status(apiResponse.statusCode).json({ message: 'SMS sent successfully' });
    });

    apiResponse.on('error', (error) => {
      console.error(error);
      // Handle the error response or send a response to the Flutter app
      res.status(500).json({ message: 'Failed to send SMS' });
    });
  });

  // Prepare the SMS data from the extracted values
  const postData = JSON.stringify({
    messages: [
      {
        destinations: [
          {
            to: phoneNumber // Use the extracted phone number
          }
        ],
        from: 'InfoSMS',
        text: message // Use the extracted message content
      }
    ]
  });

  // Write the SMS data to the Infobip API request
  apiRequest.write(postData);
  apiRequest.end();
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
