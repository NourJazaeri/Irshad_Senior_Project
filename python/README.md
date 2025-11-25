# Python Services Setup Guide

This guide will help you set up and run the Python AI services (Quiz Generator and Chatbot) for the Irshad platform.

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## Step 1: Install Dependencies

1. Navigate to the `python` directory:
   ```bash
   cd python
   ```

2. Install all required packages:
   ```bash
   pip install -r requirements.txt
   ```

   This will install:
   - FastAPI (web framework)
   - uvicorn (ASGI server)
   - google-generativeai (Gemini AI)
   - pdfplumber (PDF processing)
   - yt-dlp (YouTube transcript extraction)
   - langchain-google-genai (LangChain integration)
   - python-dotenv (environment variable loading)
   - And other dependencies

## Step 2: Set Up Environment Variables

1. Open the existing `.env` file in the `python` directory (or project root)

2. Add or update your Gemini API key in the `.env` file:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

   **How to get your API key:**
   - Go to https://aistudio.google.com/apikey
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the key and paste it in your `.env` file

3. (Optional) You can also add these variables if needed:
   ```env
   GEMINI_API_KEY=your_api_key_here
   GEMINI_MODEL=gemini-2.0-flash
   GEMINI_EMBEDDING_MODEL=models/text-embedding-004
   KNOWLEDGE_BASE_PATH=./majestic_realistic_knowledge_base.csv
   ```

   **Note:** The `.env` file should already exist. If it doesn't, create it in the `python/` directory or project root.

## Step 3: Run the Services

You need to run **two services** in separate terminal windows:

### Terminal 1: Quiz Service (Port 8001)

```bash
cd python
python quiz_service.py --serve
```

You should see:
```
[OK] Loaded .env file from ...
[OK] Gemini API configured successfully
[INFO] Starting Quiz Generator API server on http://0.0.0.0:8001
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
```

### Terminal 2: Chatbot Service (Port 8002)

```bash
cd python
python chatbot_service.py --serve
```

You should see:
```
✅ Loaded .env file from ...
Starting Chatbot API server on http://0.0.0.0:8002
INFO:     Uvicorn running on http://0.0.0.0:8002 (Press CTRL+C to quit)
```

## Step 4: Verify Services Are Running

### Test Quiz Service:
Open your browser and visit: http://localhost:8001/health

You should see: `{"status":"ok"}`

### Test Chatbot Service:
Open your browser and visit: http://localhost:8002/health

You should see: `{"status":"ok"}`

## Alternative: Using uvicorn Directly

If you prefer using uvicorn directly:

**Quiz Service:**
```bash
cd python
uvicorn quiz_service:app --host 0.0.0.0 --port 8001
```

**Chatbot Service:**
```bash
cd python
uvicorn chatbot_service:app --host 0.0.0.0 --port 8002
```

## Troubleshooting

### Error: "GEMINI_API_KEY environment variable must be set"
- Make sure your `.env` file exists in the `python/` directory (or project root)
- Check that `GEMINI_API_KEY=your_key` is in the file (no quotes, no spaces around `=`)
- Restart the service after updating the `.env` file

### Error: "ModuleNotFoundError: No module named 'fastapi'"
- Run: `pip install -r requirements.txt`
- Make sure you're using the correct Python environment

### Error: "403 Your API key was reported as leaked"
- Your API key has been revoked
- Generate a new API key from https://aistudio.google.com/apikey
- Update your `.env` file with the new key
- Restart the services

### Services won't start
- Check that ports 8001 and 8002 are not already in use
- Make sure Python 3.8+ is installed: `python --version`
- Verify all dependencies are installed: `pip list`

## Important Notes

1. **Keep both services running** while using the platform
2. **Don't commit your `.env` file** to version control (it should be in `.gitignore`)
3. **Restart services** after changing the `.env` file
4. The services only load environment variables at startup

## Next Steps

Once both services are running:
1. Start your Node.js server (in the `server/` directory)
2. Start your React frontend (in the `client/` directory)
3. The frontend will automatically connect to these Python services

## File Structure

```
python/
├── .env                    # Your API keys (update this file)
├── requirements.txt        # Python dependencies
├── quiz_service.py        # Quiz generation service (port 8001)
├── chatbot_service.py     # Chatbot service (port 8002)
└── majestic_realistic_knowledge_base.csv  # Knowledge base for chatbot
```

