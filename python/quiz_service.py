# -*- coding: utf-8 -*-

"""Quiz Generator from Multiple Sources

This script extracts text from YouTube videos, PDFs, or images
and generates multiple-choice quiz questions using Google's Gemini AI.

Dependencies (install with: pip install google-generativeai pdfplumber yt-dlp):
    - google-generativeai: For Gemini AI integration
    - pdfplumber: For PDF text extraction
    - yt-dlp: For YouTube transcript extraction (more reliable than youtube-transcript-api)
    - Pillow: For image processing (optional)

yt-dlp is preferred over youtube-transcript-api because:
    ✅ Actively maintained and updated for YouTube changes
    ✅ More robust error handling
    ✅ Better support for various video types
"""

try:
    import google.generativeai as genai
    import pdfplumber
    import yt_dlp
except ImportError as e:
    print(f"[ERROR] Missing dependency: {e}")
    print("Please install required packages: pip install google-generativeai pdfplumber yt-dlp")
    raise

import json
import re
import os
import sys
import argparse
import tempfile
import urllib.request
import urllib.parse
import mimetypes
from typing import Optional, Union
from pathlib import Path

try:
    from fastapi import FastAPI, UploadFile, File, Form, Request
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse
    import uvicorn
except ImportError:
    # Server mode is optional; only needed when --serve is used
    FastAPI = None  # type: ignore
    UploadFile = None  # type: ignore
    File = None  # type: ignore
    Form = None  # type: ignore
    Request = None  # type: ignore
    CORSMiddleware = None  # type: ignore
    JSONResponse = None  # type: ignore
    uvicorn = None  # type: ignore

# --- LOAD .env FILE ---
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        load_dotenv(env_path)
        print(f"[OK] Loaded .env file from {env_path}")
    else:
        # Try loading from parent directory
        parent_env = Path(__file__).parent.parent / '.env'
        if parent_env.exists():
            load_dotenv(parent_env)
            print(f"[OK] Loaded .env file from {parent_env}")
        else:
            print(f"[INFO] No .env file found at {env_path} or {parent_env}")
except ImportError:
    # python-dotenv not installed, skip .env loading
    print("[WARN] python-dotenv not installed. Install with: pip install python-dotenv")
    print("[WARN] Will use environment variables only.")

# --- CONFIGURE GEMINI ---
def configure_gemini(api_key=None):
    """Configure Gemini API. Uses environment variable GEMINI_API_KEY if api_key is None."""
    if api_key is None:
        api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        raise ValueError(
            "Please set your Gemini API key:\n"
            "  1. Set environment variable: GEMINI_API_KEY=your_key_here\n"
            "  2. Or pass it to configure_gemini(api_key='your_key_here')"
        )
    
    genai.configure(api_key=api_key)
    # Using gemini-2.0-flash model
    return genai.GenerativeModel("gemini-2.0-flash")

# Initialize model (will raise error if API key not set)
# ⭐ IMPORTANT: Set GEMINI_API_KEY in .env file or as environment variable
try:
    model = configure_gemini()
    print("[OK] Gemini API configured successfully")
except ValueError as e:
    print(f"[ERROR] {e}")
    print("[ERROR] Cannot start service without valid API key!")
    print("[INFO] Make sure GEMINI_API_KEY is set in your .env file or as an environment variable.")
    model = None

def extract_text_from_pdf(file_path):
    """Extract text from PDF file."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF file not found: {file_path}")
    
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
        
        if not text.strip():
            raise ValueError(f"No text could be extracted from PDF: {file_path}")
        
        print(f"[OK] Extracted text from PDF ({len(text)} chars)")
        return text
    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {e}")

# --- GEMINI QUIZ GENERATOR ---
def _validate_and_repair_quiz(data: dict) -> dict:
    repaired_questions = []
    for q in data.get("questions", []):
        question = q.get("question")
        options = q.get("options") or []
        correct_index = q.get("correctAnswer")
        answer_text = q.get("correctAnswerText")

        # Ensure options is a list of strings of length 4
        options = [str(o) for o in options][:4]
        while len(options) < 4:
            options.append("")

        # Try to align index with text when both present
        if isinstance(answer_text, str) and answer_text:
            try:
                match_idx = next((i for i, o in enumerate(options) if o.strip() == answer_text.strip()), None)
            except Exception:
                match_idx = None
            if match_idx is not None:
                correct_index = match_idx

        # Clamp/repair index to valid range
        if not isinstance(correct_index, int) or not (0 <= correct_index < 4):
            # Fallback: if we have answer_text but didn't find it, default to first option
            correct_index = 0

        repaired_questions.append({
            "question": question,
            "options": options,
            "correctAnswer": correct_index,
            "correctAnswerText": options[correct_index] if options else "",
        })
    return {"questions": repaired_questions}

def generate_quiz(text, num_questions=5, model_instance=None):
    """Generate MCQs using Gemini."""
    # Validate num_questions
    if not isinstance(num_questions, int) or num_questions < 1 or num_questions > 20:
        raise ValueError("num_questions must be an integer between 1 and 20")
    
    if model_instance is None:
        model_instance = model
    
    if model_instance is None:
        raise ValueError("Gemini model not configured. Please set your API key first.")
    
    if not text or not text.strip():
        raise ValueError("Text content is empty. Cannot generate quiz.")
    
    prompt = f"""
You are a quiz generator AI.
Read the following content and create {num_questions} multiple-choice questions
that test understanding of the main ideas.

CONTENT:
{text[:8000]}

REQUIREMENTS:
- Provide exactly 4 options per question.
- Set correctAnswer to the index (0-3) of the correct option.
- Also include correctAnswerText equal to the exact string of the correct option.

FORMAT (JSON ONLY, NO TEXT OUTSIDE JSON):
{{
  "questions": [
    {{
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "correctAnswerText": "Option A"
    }}
  ]
}}
    """
    
    try:
        response = model_instance.generate_content(prompt)
        text_output = response.text
        # Try to extract valid JSON
        match = re.search(r"\{[\s\S]*\}", text_output)
        if match:
            data = json.loads(match.group(0))
        else:
            raise ValueError(f"No valid JSON found in Gemini response. Response: {text_output[:200]}")
        if 'questions' not in data:
            raise ValueError("Response does not contain 'questions' key")
        
        repaired = _validate_and_repair_quiz(data)
        print(f"[OK] Generated {len(repaired['questions'])} questions")
        return repaired
    except Exception as e:
        raise ValueError(f"Failed to generate quiz: {e}")

# --- MULTIMODAL (FILES) WITH GEMINI ---
def _wait_for_file_active(file_obj, timeout_seconds: int = 300):
    import time
    start = time.time()
    last_state = None
    while True:
        file_obj = genai.get_file(file_obj.name)
        state = getattr(file_obj, "state", None)
        if state != last_state:
            print(f"[INFO] File state: {state}")
            last_state = state
        if state == "ACTIVE":
            return file_obj
        if state == "FAILED":
            raise ValueError("File processing failed on server")
        if (time.time() - start) > timeout_seconds:
            raise ValueError("File processing timed out")
        time.sleep(2)

def generate_quiz_from_file(file_path: str, num_questions: int = 5, mime_type: Optional[str] = None, model_instance=None):
    if model_instance is None:
        model_instance = model
    if model_instance is None:
        raise ValueError("Gemini model not configured. Please set your API key first.")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    if mime_type is None:
        guessed, _ = mimetypes.guess_type(file_path)
        mime_type = guessed or "application/octet-stream"

    try:
        # Prefer fast inline path for small files (avoids slower upload processing)
        file_size_bytes = os.path.getsize(file_path)
        prompt = f"""
You are a quiz generator AI.
Analyze the attached file and create {num_questions} multiple-choice questions
that test understanding of the main ideas.

FORMAT (JSON ONLY, NO TEXT OUTSIDE JSON):
{{
  "questions": [
    {{
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "correctAnswerText": "Option A"
    }}
  ]
}}
"""
        if file_size_bytes <= 8 * 1024 * 1024:  # <= 8 MB
            print(f"[INFO] Using inline upload (fast path), size={file_size_bytes} bytes")
            with open(file_path, "rb") as f:
                data_bytes = f.read()
            part = {"mime_type": mime_type, "data": data_bytes}
            response = model_instance.generate_content([prompt, part])
        else:
            print(f"[INFO] Uploading file to Gemini: {file_path} ({mime_type}), size={file_size_bytes} bytes")
            uploaded = genai.upload_file(file_path, mime_type=mime_type)
            active_file = _wait_for_file_active(uploaded)
            response = model_instance.generate_content([prompt, active_file])

        text_output = response.text
        match = re.search(r"\{[\s\S]*\}", text_output)
        if match:
            data = json.loads(match.group(0))
        else:
            raise ValueError(f"No valid JSON found in Gemini response. Response: {text_output[:200]}")
        if 'questions' not in data:
            raise ValueError("Response does not contain 'questions' key")

        repaired = _validate_and_repair_quiz(data)
        print(f"[OK] Generated {len(repaired['questions'])} questions from file")
        return repaired
    except Exception as e:
        # Graceful fallback for PDFs: try local text extraction if available
        if mime_type and mime_type.startswith("application/pdf"):
            try:
                print("[WARN] File upload path failed; falling back to local PDF text extraction...")
                text = extract_text_from_pdf(file_path)
                return generate_quiz(text, num_questions=num_questions, model_instance=model_instance)
            except Exception as inner:
                raise ValueError(f"Failed to generate quiz from file (and fallback failed): {e}; {inner}")
        raise ValueError(f"Failed to generate quiz from file: {e}")

def _extract_youtube_video_id(url: str) -> Optional[str]:
    """Extract video ID from YouTube URL"""
    m = re.match(r"^.*(youtu.be/|v/|u/\w/|embed/|watch\?v=|&v=)([^#&?]*).*$", url)
    if m and len(m.group(2)) == 11:
        return m.group(2)
    return None

def extract_youtube_transcript(url: str) -> str:
    """Extract transcript from YouTube video using yt-dlp (more reliable than youtube-transcript-api)"""
    import urllib.request
    import json
    
    vid = _extract_youtube_video_id(url)
    if not vid:
        raise ValueError("Invalid YouTube URL - could not extract video ID")
    
    print(f"[INFO] Extracting transcript from YouTube video ID: {vid}")
    print(f"[INFO] Full URL: {url}")
    
    ydl_opts = {
        'skip_download': True,
        'writesubtitles': True,
        'writeautomaticsub': True,
        'subtitleslangs': ['en', 'ar'],
        'quiet': True,
        'no_warnings': True,
        'ignoreerrors': False,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            print("[INFO] Fetching video info...")
            info = ydl.extract_info(url, download=False)
            
            if not info:
                raise ValueError("Could not fetch video information")
            
            # Get subtitles
            subtitles = info.get('subtitles', {})
            automatic_captions = info.get('automatic_captions', {})
            
            print(f"[INFO] Manual subtitles available: {list(subtitles.keys())}")
            print(f"[INFO] Auto-captions available: {list(automatic_captions.keys())}")
            
            # Prefer manual subtitles, fallback to auto-generated
            all_subs = {**automatic_captions, **subtitles}
            
            if not all_subs:
                raise ValueError(
                    "No transcripts/captions available for this video. "
                    "Please choose a video with captions enabled (look for CC button on YouTube)."
                )
            
            # Try languages in order: English, Arabic, then any available
            transcript_text = None
            for lang in ['en', 'ar', *all_subs.keys()]:
                if lang in all_subs:
                    try:
                        print(f"[INFO] Attempting to fetch '{lang}' subtitles...")
                        sub_list = all_subs[lang]
                        
                        if not sub_list:
                            continue
                        
                        # Get the subtitle URL (prefer json3 format)
                        sub_url = None
                        for sub_format in sub_list:
                            if sub_format.get('ext') == 'json3':
                                sub_url = sub_format.get('url')
                                break
                        
                        if not sub_url and sub_list:
                            sub_url = sub_list[0].get('url')
                        
                        if not sub_url:
                            print(f"[WARN] No URL found for {lang} subtitles")
                            continue
                        
                        # Fetch and parse subtitles
                        with urllib.request.urlopen(sub_url) as response:
                            content = response.read().decode('utf-8')
                            sub_data = json.loads(content)
                        
                        # Extract text from subtitle events
                        text_parts = []
                        for event in sub_data.get('events', []):
                            if 'segs' in event:
                                for seg in event['segs']:
                                    if 'utf8' in seg:
                                        text_parts.append(seg['utf8'])
                        
                        transcript_text = " ".join(text_parts)
                        
                        # Clean up the text
                        transcript_text = re.sub(r'\s+', ' ', transcript_text).strip()
                        
                        if transcript_text and len(transcript_text) >= 50:
                            print(f"[OK] Successfully extracted {len(transcript_text)} characters from '{lang}' subtitles")
                            return transcript_text
                        else:
                            print(f"[WARN] Transcript too short for {lang}: {len(transcript_text)} chars")
                    
                    except Exception as e:
                        print(f"[WARN] Failed to fetch {lang} subtitles: {e}")
                        continue
            
            # If we get here, no valid transcript was found
            if all_subs:
                raise ValueError(
                    f"Found subtitles but could not extract text. Available languages: {list(all_subs.keys())}"
                )
            else:
                raise ValueError("No transcripts available for this video")
    
    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e)
        print(f"[ERROR] yt-dlp download error: {error_msg}")
        
        if "Video unavailable" in error_msg:
            raise ValueError("This YouTube video is unavailable or private")
        elif "age" in error_msg.lower():
            raise ValueError("This video is age-restricted and cannot be accessed")
        else:
            raise ValueError(f"Cannot access video: {error_msg}")
    
    except ValueError:
        raise  # Re-raise ValueError as-is
    
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        raise ValueError(f"Failed to extract YouTube transcript: {str(e)}")

# --- MAIN FUNCTION ---
def analyze_and_generate(source_type, source_path_or_url, num_questions=5):
    """Main function that routes based on content type.
    
    Args:
        source_type: "youtube", "pdf", or "image"
        source_path_or_url: URL for YouTube, file path for PDF/image
        num_questions: Number of questions to generate (default: 5)
    
    Returns:
        Dictionary containing quiz questions
    """
    if source_type == "youtube":
        # Extract transcript from YouTube and generate quiz from it
        print(f"[INFO] Processing YouTube video: {source_path_or_url}")
        try:
            transcript = extract_youtube_transcript(source_path_or_url)
            print(f"[INFO] Generating quiz from transcript")
            return generate_quiz(transcript, num_questions=num_questions)
        except Exception as e:
            raise ValueError(f"Failed to generate quiz from YouTube: {e}")
    elif source_type == "pdf":
        # Prefer Gemini multimodal to handle both digital-text and scanned PDFs
        return generate_quiz_from_file(source_path_or_url, num_questions=num_questions, mime_type="application/pdf")
    elif source_type == "image":
        # Use Gemini multimodal for images (PNG/JPG, etc.)
        mime_guess, _ = mimetypes.guess_type(source_path_or_url)
        if not mime_guess:
            ext = os.path.splitext(source_path_or_url)[1].lower()
            if ext in (".png",):
                mime_guess = "image/png"
            elif ext in (".jpg", ".jpeg"):
                mime_guess = "image/jpeg"
            else:
                mime_guess = "application/octet-stream"
        return generate_quiz_from_file(source_path_or_url, num_questions=num_questions, mime_type=mime_guess)
    else:
        raise ValueError(f"Unsupported source type: {source_type}. Use 'youtube', 'pdf', or 'image'")

# --- FastAPI Integration ---
app = None  # Initialize to None

if FastAPI is not None:
    app = FastAPI(title="Quiz Generator API")
    
    if CORSMiddleware:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    
    def get_error_suggestion(error_msg: str) -> str:
        """Provide helpful suggestions based on error type"""
        error_lower = error_msg.lower()
        
        if "no element found" in error_lower or "transcript" in error_lower:
            return (
                "Try a different YouTube video with captions enabled, "
                "or upload the content as a PDF/image file instead."
            )
        elif "rate limit" in error_lower or "too many requests" in error_lower:
            return "Please wait 30-60 minutes before trying again, or upload content as a PDF file."
        elif "api key" in error_lower:
            return "Check that your Gemini API key is valid and has sufficient quota."
        elif "too short" in error_lower:
            return "The content is too short to generate meaningful quiz questions."
        elif "video unavailable" in error_lower or "private" in error_lower:
            return "This video cannot be accessed. Try a different public video or upload as PDF."
        else:
            return "Please check your input and try again, or upload content as a PDF file."
    
    @app.get("/health")
    def health():
        return {"status": "ok"}
    
    @app.post("/ai")
    async def ai_endpoint(request: Request):
        try:
            # Parse request based on content type
            content_type = request.headers.get("content-type", "")
            
            # Initialize variables
            task = None
            numQuestions = 5
            text = None
            url = None
            file = None
            
            if "application/json" in content_type:
                # Handle JSON requests
                body = await request.json()
                task = body.get("task")
                numQuestions = body.get("numQuestions", 5)
                text = body.get("text")
                url = body.get("url")
            elif "multipart/form-data" in content_type:
                # Handle multipart form data
                form = await request.form()
                task = form.get("task")
                numQuestions = int(form.get("numQuestions", 5))
                text = form.get("text")
                url = form.get("url")
                file = form.get("file")
            else:
                return JSONResponse(
                    {"error": "Unsupported content type"},
                    status_code=400
                )
            
            # Default task
            if not task:
                task = "quiz"
            
            # Validate numQuestions
            try:
                numQuestions = int(numQuestions)
                if numQuestions < 1 or numQuestions > 20:
                    return JSONResponse(
                        {"error": "numQuestions must be between 1 and 20"},
                        status_code=400
                    )
            except (ValueError, TypeError):
                return JSONResponse(
                    {"error": "numQuestions must be a valid integer"},
                    status_code=400
                )
            
            # Determine source type and path
            source_type = None
            source_path = None
            
            if file:
                # Handle file upload
                suffix = os.path.splitext(file.filename or "")[1]
                fd, temp_path = tempfile.mkstemp(suffix=suffix)
                os.close(fd)
                
                try:
                    with open(temp_path, "wb") as out:
                        content = await file.read()
                        if not content:
                            raise ValueError("Uploaded file is empty")
                        out.write(content)
                        print(f"[INFO] Saved uploaded file: {file.filename} ({len(content)} bytes) to {temp_path}")
                    
                    # Determine type from mime type or extension
                    if file.content_type and file.content_type.startswith("application/pdf"):
                        source_type = "pdf"
                    elif file.content_type and file.content_type.startswith("image/"):
                        source_type = "image"
                    elif suffix.lower() == ".pdf":
                        source_type = "pdf"
                    elif suffix.lower() in [".png", ".jpg", ".jpeg"]:
                        source_type = "image"
                    else:
                        source_type = "pdf"  # default
                    
                    print(f"[INFO] Processing file as: {source_type}, mime_type: {file.content_type}, extension: {suffix}")
                    
                    result = analyze_and_generate(source_type, temp_path, num_questions=numQuestions)
                    return JSONResponse(result)
                except Exception as processing_error:
                    # Log the full error for debugging
                    import traceback
                    error_trace = traceback.format_exc()
                    print(f"[ERROR] File processing failed: {processing_error}")
                    print(f"[ERROR] Traceback: {error_trace}")
                    raise  # Re-raise to be caught by outer exception handler
                finally:
                    # Robust file cleanup
                    if os.path.exists(temp_path):
                        try:
                            os.remove(temp_path)
                            print(f"[INFO] Cleaned up temp file: {temp_path}")
                        except PermissionError:
                            print(f"[WARN] Could not delete temp file (locked): {temp_path}")
                        except Exception as cleanup_error:
                            print(f"[WARN] Error cleaning up temp file: {cleanup_error}")
            
            elif url:
                # Handle URL (YouTube or web page only)
                # Check if it's a YouTube URL
                if "youtube.com" in url or "youtu.be" in url:
                    source_type = "youtube"
                    source_path = url
                    result = analyze_and_generate(source_type, source_path, num_questions=numQuestions)
                    return JSONResponse(result)
                else:
                    # Validate that the URL is not a direct file link (PDF, image, etc.)
                    url_lower = url.lower()
                    
                    # Check for common file extensions in URL
                    file_extensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', 
                                     '.zip', '.rar', '.jpg', '.jpeg', '.png', '.gif', '.mp4', 
                                     '.mp3', '.avi', '.mov', '.exe', '.dmg']
                    
                    if any(url_lower.endswith(ext) or f'{ext}?' in url_lower for ext in file_extensions):
                        return JSONResponse(
                            {
                                "error": "File URLs are not supported. Please use YouTube URLs for videos or upload files directly.",
                                "type": "user_error",
                                "suggestion": "For PDF files, use the file upload option instead of providing a URL."
                            },
                            status_code=400
                        )
                    
                    # If it looks like a regular webpage, reject it for now
                    # (We don't have web scraping implemented for security/legal reasons)
                    return JSONResponse(
                        {
                            "error": "Only YouTube URLs are currently supported. For other content, please upload as a file or paste text.",
                            "type": "user_error",
                            "suggestion": "Download the webpage content and upload it as a PDF, or copy the text and paste it directly."
                        },
                        status_code=400
                    )
            
            elif text:
                # Handle raw text
                result = generate_quiz(text, num_questions=numQuestions)
                return JSONResponse(result)
            
            else:
                return JSONResponse(
                    {"error": "Provide 'url' or 'text' or 'file'"},
                    status_code=400
                )
        
        except ValueError as e:
            # User-friendly errors (like YouTube transcript issues, validation errors)
            error_msg = str(e)
            print(f"[ERROR] User error: {error_msg}")
            import traceback
            traceback.print_exc()
            return JSONResponse(
                {
                    "error": error_msg,
                    "type": "user_error",
                    "suggestion": get_error_suggestion(error_msg)
                },
                status_code=400  # Use 400 for user errors, not 500
            )
        except Exception as e:
            # Unexpected server errors
            error_msg = str(e)
            print(f"[ERROR] Unexpected error: {error_msg}")
            import traceback
            error_trace = traceback.format_exc()
            print(f"[ERROR] Full traceback: {error_trace}")
            
            # Provide more helpful error messages
            error_lower = error_msg.lower()
            if "gemini" in error_lower or "api key" in error_lower:
                suggestion = "Check that your Gemini API key is valid and has sufficient quota."
            elif "file" in error_lower or "pdf" in error_lower:
                suggestion = "The file may be corrupted or in an unsupported format. Try a different PDF file."
            else:
                suggestion = get_error_suggestion(error_msg)
            
            return JSONResponse(
                {
                    "error": "An unexpected error occurred. Please try again.",
                    "detail": error_msg,
                    "type": "server_error",
                    "suggestion": suggestion
                },
                status_code=500
            )

# --- CLI and Server Runner ---
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--serve":
        if FastAPI is None or uvicorn is None or app is None:
            print("FastAPI/uvicorn not installed. Install with: pip install fastapi uvicorn")
            sys.exit(1)
        print("[INFO] Starting Quiz Generator API server on http://0.0.0.0:8001")
        uvicorn.run(app, host="0.0.0.0", port=8001)
    else:
        print("To run as server: python quiz_service.py --serve")
        print("Or use: uvicorn quiz_service:app --host 0.0.0.0 --port 8001")
