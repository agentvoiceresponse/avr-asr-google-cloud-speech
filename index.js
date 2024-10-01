const express = require('express');
const { Writable } = require('stream');
const { SpeechClient } = require('@google-cloud/speech');

require('dotenv').config();

const app = express();

const speechClient = new SpeechClient();

const requestConfig = {
  config: {
    encoding: 'LINEAR16',
    sampleRateHertz: 8000, // Adjust as needed
    languageCode: process.env.SPEECH_RECOGNITION_LANGUAGE || 'en-US',
    model: process.env.SPEECH_RECOGNITION_MODEL || 'telephony'
  },
  interimResults: true, // Enable interim results to stream partial transcriptions
};

console.log("Google Speech Configuration", requestConfig)
/**
 * Class representing a writable stream for audio data.
 * @extends Writable
 * @constructor
 * @param {RecognizeStream} recognizeStream - The stream used for speech recognition.
 * @method _write - Writes data to the recognizeStream.
 * @method _final - Finalizes the stream by ending the recognizeStream.
 */
class AudioWritableStream extends Writable {
  constructor(recognizeStream) {
    super();
    this.recognizeStream = recognizeStream;
  }

  _write(chunk, encoding, callback) {
    this.recognizeStream.write(chunk);
    callback();
  }

  _final(callback) {
    this.recognizeStream.end();
    callback();
  }
}

app.post('/audio-stream', (req, res) => {
  const recognizeStream = speechClient
    .streamingRecognize(requestConfig)
    .on('error', (err) => {
      console.error('Google Speech API Error:', err);
      res.status(500).send('Error with Speech API');
    })
    .on('data', (data) => {
      if (data.results[0] && data.results[0].alternatives[0]) {
        const transcript = data.results[0].alternatives[0].transcript;
        console.log(`Transcription: ${transcript}`);
        if (data.results[0].alternatives[0].confidence) {
            console.log(`Confidence: ${data.results[0].alternatives[0].confidence}`);
            res.write(`${transcript}\n\n`); // Stream the transcript to the client
        }
      }
    })
    .on('end', () => {
      res.end(); // Close the connection when transcription ends
    });

  // Set appropriate headers for streaming response
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const audioWritableStream = new AudioWritableStream(recognizeStream);
  req.pipe(audioWritableStream);

  req.on('end', () => {
    audioWritableStream.end();
  });

  req.on('error', (err) => {
    console.error('Error receiving audio stream:', err);
    res.status(500).json({ message: 'Error receiving audio stream' });
  });
});

const port = process.env.PORT || 6001;
app.listen(port, () => {
  console.log(`Audio endpoint listening on port ${port}`);
});
