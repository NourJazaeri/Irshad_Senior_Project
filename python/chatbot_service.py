# -*- coding: utf-8 -*-

"""
Chatbot Service (Gemini + LangChain, CSV Knowledge Base)
Lightweight version – no PyTorch or Transformers required
"""

import os
import sys
import pandas as pd
import logging
from typing import Optional, Dict, List, Any, Union
from pathlib import Path
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from starlette.requests import Request as FastAPIRequest
from pydantic import BaseModel, Field, validator
import uvicorn

# LangChain components
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda, RunnableParallel

# -------------------------------------------------
# Logging
# -------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# -------------------------------------------------
# Load .env file (if exists)
# -------------------------------------------------
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        load_dotenv(env_path)
        logger.info(f"✅ Loaded .env file from {env_path}")
    else:
        parent_env = Path(__file__).parent.parent / '.env'
        if parent_env.exists():
            load_dotenv(parent_env)
            logger.info(f"✅ Loaded .env file from {parent_env}")
except ImportError:
    logger.warning("⚠️  python-dotenv not installed. Install with: pip install python-dotenv")

# -------------------------------------------------
# Config
# -------------------------------------------------
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable must be set")

MODEL_NAME = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
EMBEDDING_MODEL = os.environ.get("GEMINI_EMBEDDING_MODEL", "models/text-embedding-004")
CSV_PATH = Path(os.environ.get("KNOWLEDGE_BASE_PATH", 
                               str(Path(__file__).parent / "majestic_realistic_knowledge_base.csv")))
MAX_HISTORY_MESSAGES = int(os.environ.get("MAX_HISTORY_MESSAGES", "20"))
MAX_HISTORY_AGE_HOURS = int(os.environ.get("MAX_HISTORY_AGE_HOURS", "24"))

# -------------------------------------------------
# App setup
# -------------------------------------------------
app = FastAPI(title="Gemini Chatbot Service", version="3.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

chatbot_instances: Dict[str, Any] = {}
vector_stores: Dict[str, FAISS] = {}
chat_histories: Dict[str, List] = {}
chat_history_timestamps: Dict[str, datetime] = {}

# -------------------------------------------------
# Data loading helpers
# -------------------------------------------------

def load_csv_knowledge(company_id: str) -> List[str]:
    if not CSV_PATH.exists():
        return []
    try:
        df = pd.read_csv(CSV_PATH)
    except Exception as e:
        logger.error(f"❌ Failed to read CSV knowledge base: {e}")
        return []
    company_df = df[df["company_id"] == company_id].copy()
    if company_df.empty:
        return []
    return (company_df["question"] + " " + company_df["answer"]).tolist()


def build_knowledge_corpus(company_id: str) -> List[str]:
    chunks = load_csv_knowledge(company_id)
    if not chunks:
        return ["No knowledge base available for this company."]
    return chunks

# -------------------------------------------------
# Request/Response Models
# -------------------------------------------------
class ChatRequest(BaseModel):
    query: str
    company_id: str
    user_id: Optional[str] = None
    conversation_id: Optional[str] = None

    @validator("query")
    def not_empty(cls, v):
        if not v.strip():
            raise ValueError("Query cannot be empty")
        return v.strip()

    @validator("user_id")
    def user_not_empty(cls, v):
        if v is None:
            return v
        if not v.strip():
            raise ValueError("user_id cannot be empty if provided")
        return v.strip()

class ChatResponse(BaseModel):
    answer: str
    conversation_id: Optional[str] = None
    ok: bool = True
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    ok: bool = False

# -------------------------------------------------
# Cleanup utility
# -------------------------------------------------
def cleanup_old_histories():
    now = datetime.now()
    expired = [uid for uid, ts in chat_history_timestamps.items() if now - ts > timedelta(hours=MAX_HISTORY_AGE_HOURS)]
    for uid in expired:
        chat_histories.pop(uid, None)
        chat_history_timestamps.pop(uid, None)
        logger.info(f"🧹 Cleaned chat history for user {uid}")

# -------------------------------------------------
# Initialization
# -------------------------------------------------
def initialize_chatbot(company_id: str):
    if company_id in chatbot_instances:
        return chatbot_instances[company_id]
    
    logger.info(f"🤖 Initializing chatbot for {company_id}")
    
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"Knowledge base not found: {CSV_PATH}")
    
    texts = build_knowledge_corpus(company_id)
    
    # ---- GEMINI Embeddings (no Torch) ----
    logger.info(f"🔢 Creating Google Gemini embeddings with model: {EMBEDDING_MODEL}")
    embedding = GoogleGenerativeAIEmbeddings(model=EMBEDDING_MODEL, google_api_key=GOOGLE_API_KEY)
    db = FAISS.from_texts(texts, embedding)
    retriever = db.as_retriever(search_kwargs={"k": 3})
    vector_stores[company_id] = db
    
    llm = ChatGoogleGenerativeAI(model=MODEL_NAME, google_api_key=GOOGLE_API_KEY, temperature=0.7)
    
    
    def format_docs(docs):
        return "\n\n".join([doc.page_content for doc in docs])
    
    prompt_template = """You are a helpful AI assistant for the company. 
Answer the user's question using the information provided in the context below.

Use the context to provide accurate, specific answers. If the information is not in the context, say so politely.

Context:
{context}
{chat_history}

Question: {question}

Answer:"""
    
    prompt = ChatPromptTemplate.from_template(prompt_template)
    
    def build_input(input_dict):
        history_str = ""
        user_id = input_dict.get("user_id")
        hist = chat_histories.get(user_id)
        if hist:
            history_str = "\n".join(
                f"Human: {m.content}" if isinstance(m, HumanMessage) else f"Assistant: {m.content}"
                for m in hist[-6:]
            )
        
        return {
            "context": input_dict.get("context", ""),
            "question": input_dict.get("question", ""),
            "chat_history": history_str
        }
    
    # Create the chain using RunnableParallel for proper LCEL syntax
    # RunnableParallel runs multiple runnables in parallel and combines their outputs
    # The input to invoke() should be {"question": "..."}, and RunnableParallel will pass it to both branches
    chatbot = (
        RunnableParallel({
            "context": RunnableLambda(lambda x: format_docs(retriever.invoke(x.get("question", "")))),
            "question": RunnableLambda(lambda x: x.get("question", "")),
            "user_id": RunnableLambda(lambda x: x.get("user_id"))
        })
        | RunnableLambda(build_input)
        | prompt
        | llm
        | StrOutputParser()
    )
    
    chatbot_instances[company_id] = chatbot
    return chatbot

# -------------------------------------------------
# API Endpoints
# -------------------------------------------------
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "active_companies": len(chatbot_instances),
        "embedding_backend": "Google Gemini",
        "embedding_model": EMBEDDING_MODEL,
        "llm_model": MODEL_NAME,
        "timestamp": datetime.utcnow().isoformat(),
    }

@app.post("/chat", response_model=ChatResponse, responses={500: {"model": ErrorResponse}})
async def chat(request: ChatRequest):
    try:
        logger.info(f"📥 Received chat request - company_id={request.company_id}, user_id={request.user_id}, query_length={len(request.query)}")
        cleanup_old_histories()
        bot = initialize_chatbot(request.company_id)
        actual_user_id = request.user_id.strip() if request.user_id else None
        company_key = request.company_id.strip()
        chat_key = actual_user_id or company_key
        if not actual_user_id:
            logger.warning(f"⚠️ user_id not provided; falling back to company_id {request.company_id} for history key")
        else:
            logger.info(f"✅ Using user_id={actual_user_id} for personalization")
        chat_history_timestamps[chat_key] = datetime.now()
        
        chat_histories.setdefault(chat_key, [])
        chat_histories[chat_key].append(HumanMessage(content=request.query))
        answer = bot.invoke({
            "question": request.query,
            "user_id": chat_key
        })
        chat_histories[chat_key].append(AIMessage(content=answer))
        chat_histories[chat_key] = chat_histories[chat_key][-MAX_HISTORY_MESSAGES:]
        
        return ChatResponse(answer=answer, conversation_id=request.conversation_id)
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": str(e), "ok": False})

@app.post("/chat/reset")
async def reset_chat(request: FastAPIRequest):
    try:
        data = await request.json()
        user_id = data.get("user_id")
        fallback_key = data.get("company_id")
        if not user_id and not fallback_key:
            raise HTTPException(status_code=400, detail="user_id or company_id required")
        chat_key = (user_id or fallback_key).strip()
        
        chat_histories.pop(chat_key, None)
        chat_history_timestamps.pop(chat_key, None)
        logger.info(f"🔄 Reset chat for key {chat_key}")
        return {"ok": True, "message": "Chat reset successfully"}
    except Exception as e:
        logger.error(e)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/favicon.ico")
async def favicon():
    """Handle favicon requests to prevent 404 logs."""
    return Response(status_code=204)

# -------------------------------------------------
# CLI Mode (optional for local testing)
# -------------------------------------------------
def run_cli():
    cid = input("Enter company_id: ").strip()
    uid = input("Enter user_id: ").strip() or cid
    bot = initialize_chatbot(cid)
    print("Chatbot ready! Type 'exit' to quit.\n")
    
    while True:
        q = input("You: ")
        if q.lower() in ["exit", "quit"]:
            break
        
        chat_histories.setdefault(uid, [])
        chat_histories[uid].append(HumanMessage(content=q))
        a = bot.invoke({"question": q, "user_id": uid})
        chat_histories[uid].append(AIMessage(content=a))
        print("Bot:", a, "\n")

# -------------------------------------------------
# Entry point
# -------------------------------------------------
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser()
    parser.add_argument("--serve", action="store_true")
    parser.add_argument("--port", type=int, default=8002)
    parser.add_argument("--host", type=str, default="0.0.0.0")
    
    args = parser.parse_args()
    
    if args.serve:
        logger.info(f"Starting Chatbot API server on http://{args.host}:{args.port}")
        logger.info("✅ Using Google Gemini embeddings - no PyTorch/Transformers needed!")
        uvicorn.run(app, host=args.host, port=args.port)
    else:
        run_cli()