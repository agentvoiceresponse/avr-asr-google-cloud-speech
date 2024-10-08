/**
 * index.js
 * This file is the main entrypoint for the application.
 * @author  Giuseppe Careri
 * @see https://www.gcareri.com
 */
const express = require('express');
const { Writable } = require('stream');
const { SpeechClient } = require('@google-cloud/speech');

require('dotenv').config();

const app = express();

const speechClient = new SpeechClient();

const requestConfig = {
  config: {
    encoding: 'LINEAR16', // Asterisk Audio Socket Encoding
    sampleRateHertz: 8000, // Asterisk Audio Socket Sample Rate Hertz
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
    try {
      this.recognizeStream.write(chunk);
      callback()
    } catch (error) {
      console.error(error)
      callback(error);
    }
  }

  _final(callback) {
    try {
      this.recognizeStream.end();
      callback();
    } catch (error) {
      console.error(error)
      callback(error);
    }
  }
}

/**
 * Handles an audio stream from the client and uses the Google Cloud Speech
 * to Speech API to recognize the speech and stream the transcript back to the
 * client.
 *
 * @param {Object} req - The Express request object
 * @param {Object} res - The Express response object
 */
const handleAudioStream = (req, res) => {
  try {
    const recognizeStream = speechClient
      .streamingRecognize(requestConfig)
      .on('error', (err) => {
        console.error('Google Speech API Error:', err);
        res.status(500).send('Error with Speech API');
      })
      .on('data', (data) => {
        if (data.results[0] && data.results[0].alternatives[0]) {
          const transcript = data.results[0].alternatives[0].transcript;
          const confidance = data.results[0].alternatives[0].confidence;
          if (transcript) {
            console.log(`${transcript}...`);
            if (confidance) {
              console.log(`Transcript: ${transcript}`);
              console.log(`Confidence: ${confidance}`);
              res.write(transcript); // Stream the transcript to the client
            }
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
      try {
        audioWritableStream.end();
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error receiving audio stream' });
      }
    });

    req.on('error', (err) => {
      console.error('Error receiving audio stream:', err);
      res.status(500).json({ message: 'Error receiving audio stream' });
    });
  } catch (err) {
    console.error('Error receiving audio stream:', err);
    res.status(500).json({ message: err.message });

  }

}

app.post('/speech-to-text-stream', handleAudioStream);

const port = process.env.PORT || 6001;
app.listen(port, () => {
  console.log(`Audio endpoint listening on port ${port}`);
});
