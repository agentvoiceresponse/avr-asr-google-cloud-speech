# Agent Voice Response - Google Cloud Speech-to-Text Integration

This repository provides a real-time speech-to-text transcription service using **Google Cloud Speech-to-Text API** integrated with the **Agent Voice Response** system. The code sets up an Express.js server that accepts audio streams from Agent Voice Response Core, transcribes the audio using the Google Cloud API, and streams the transcription back to the Agent Voice Response Core in real-time.

## Prerequisites

Before setting up the project, ensure you have the following:

1. **Node.js** and **npm** installed.
2. A **Google Cloud account** with the **Speech-to-Text API** enabled.
3. A **Service Account Key** from Google Cloud with the necessary permissions to access the Speech-to-Text API.

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/agentvoiceresponse/avr-asr-google-cloud-speech.git
cd avr-asr-google-cloud-speech
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Google Cloud Credentials

Create a `keyfile.json` by downloading your service account key from Google Cloud. Then, set the environment variable to use this key in your Node.js application:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/keyfile.json"
```

Alternatively, you can set this variable in your `.env` file (you can use the `dotenv` package for loading environment variables).

### 4. Configuration

Ensure that you have the following environment variables set in your `.env` file:

```
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/keyfile.json
PORT=6001
SPEECH_RECOGNITION_LANGUAGE=en-US
SPEECH_RECOGNITION_MODEL=telephony
```

You can adjust the port number as needed.

## How It Works

This application sets up an Express.js server that accepts audio streams from clients and uses Google Cloud Speech-to-Text API to transcribe the audio in real-time. The transcribed text is then streamed back to the Agent Voice Response Core. Below is an overview of the core components:

### 1. **Express.js Server**

The server listens for audio streams on a specific route (`/audio-stream`) and passes the incoming audio to the Google Cloud API for real-time transcription.

### 2. **AudioWritableStream Class**

A custom class that extends Node.js’s `Writable` stream is used to write the incoming audio data to the Google Cloud API.

### 3. **Google Cloud Speech-to-Text API**

The API processes the audio data received from the client and converts it into text using speech recognition models. The results are then streamed back to the client in real-time.

### 4. **Route /audio-stream**

This route accepts audio streams from the client and transmits the audio for transcription. The transcription is sent back to the client as soon as it’s available.

## Example Code Overview

Here’s a high-level breakdown of the key parts of the code:

- **Server Setup**: Configures the Express.js server and the Google Cloud Speech-to-Text API.
- **Audio Stream Handling**: A function, `handleAudioStream`, processes the incoming audio from clients. It:
  - Initializes a `Speech API recognize stream`.
  - Sets up event listeners to handle `error`, `data`, and `end` events.
  - Creates an `AudioWritableStream` instance that pipes the incoming audio to the Speech API.
  - Sends the transcriptions back to the client through the HTTP response stream.
  
- **Express.js Route**: The route `/audio-stream` calls the `handleAudioStream` function when a client connects.

## Running the Application

To start the application:

```bash
npm run start
```

or

```bash
npm run start:dev
```

The server will start and listen on the port specified in the `.env` file or default to `PORT=6001`.

### Sample Request

You can send audio streams to the `/audio-stream` endpoint using a client that streams audio data (e.g., a browser, mobile app, or another Node.js service). Ensure that the audio stream is compatible with the Google Cloud Speech-to-Text API format.