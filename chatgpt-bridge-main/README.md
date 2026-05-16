# ChatGPT API Bridge

This tool lets you use ChatGPT through the OpenAI API format without needing an OpenAI API key. It works by running a local server on your computer that accepts standard OpenAI API requests, then passes them to a ChatGPT tab open in your browser, and returns the response.

Any app or script that works with the OpenAI API can point to `http://localhost:3000` instead and it will just work.

## Setup

Install dependencies and start the server:

```
cd server
npm install
node server.js
```

Load the Chrome extension by going to `chrome://extensions`, enabling Developer mode, clicking Load unpacked, and selecting the `extension` folder.

Open `https://chatgpt.com` in a tab and keep it open.

## Usage

```
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"Hello"}]}'
```

Or point any OpenAI SDK to `base_url="http://localhost:3000/v1"` with any value for the API key.
