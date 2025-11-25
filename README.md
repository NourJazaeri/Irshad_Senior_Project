## Project Description

Irshad is a comprehensive employee onboarding and training management platform designed to streamline the learning process for modern organizations. The system provides a centralized solution where companies can register, organize their workforce into departments and groups, and deliver structured learning content to trainees.

The platform features role-based access control, enabling different stakeholders to interact with the system according to their responsibilities. Key capabilities include multi-tenant company management, rich content libraries with support for various media types, AI-powered learning assistance, automated quiz generation, real-time communication, progress tracking, and task management.

## Who It's For

### Company Admins
Manage company structure, departments, groups, and user accounts. Create content, manage profiles, and oversee training activities.

### Supervisors
Manage groups of trainees, create and share content, communicate via real-time chat, and track trainee progress.

### Trainees / Employees
Access assigned content, interact with an AI chatbot for help, communicate with supervisors, and manage learning tasks.

### Web Owners
Manage platform-level operations including company registration requests, approvals, and platform-wide analytics.

## Tech Stack

### Client
- **Framework**: React 
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **Styling**: TailwindCSS 
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Real-Time**: Socket.io Client


### Server
- **Runtime**: Node.js
- **Framework**: Express 
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JSON Web Tokens (jsonwebtoken), bcrypt 
- **Real-Time**: Socket.io
- **File Upload**: Multer, Supabase 
- **Email**: Nodemailer 7.0.9
- **Other**: CORS, dotenv


### Python Services
- **Framework**: FastAPI 
- **AI/ML**: 
  - Google Generative AI (google-generativeai)
  - LangChain (with Google GenAI integration)
  - FAISS (vector database)
- **Content Processing**: 
  - pdfplumber (PDF text extraction)
  - yt-dlp >=2024.10.7 (YouTube transcript extraction)
- **Data**: pandas, pymongo 
- **Server**: Uvicorn

### Database
- **Primary Database**: MongoDB (via Mongoose ODM)

### Other Tools/Services
- **Authentication**: JWT-based authentication with role-based access control
- **File Storage**: Supabase for image/file hosting
- **Email Service**: Gmail SMTP via Nodemailer
  
## Folder Structure

```
Irshad_Senior_Project-main_Branche/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page components (routes)
│   │   ├── services/       # API service functions
│   │   ├── styles/          # CSS stylesheets
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── dist/               # Production build output
├── server/                 # Node.js backend application
│   ├── src/
│   │   ├── config/         # Configuration files (DB, etc.)
│   │   ├── middleware/     # Express middleware (auth, etc.)
│   │   ├── models/         # Mongoose data models
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic services
│   │   └── scripts/        # Migration and utility scripts
│   └── uploads/            # Uploaded files storage
├── python/                 # Python AI services
│   ├── chatbot_service.py  # AI chatbot service
│   ├── quiz_service.py     # Quiz generation service
│   └── majestic_realistic_knowledge_base.csv  # Knowledge base data

```


### Client – Full Setup

**Prerequisites:**
- Node.js (v16 or higher recommended)
- npm or yarn package manager

**Steps:**

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
3. Development Mode:
   ```bash
     npm run dev
   ```


**Note**: The client is configured to proxy API requests to `http://localhost:5000` during development. Ensure the server is running for full functionality.



### Server – Full Setup

**Prerequisites:**
- Node.js (v16 or higher recommended)
- npm or yarn package manager
- MongoDB database (local or MongoDB Atlas)

**Steps:**

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. **Development Mode:**
```bash
npm run dev
```



**Database Setup:**
- The server automatically connects to MongoDB on startup
- No manual migrations required - Mongoose handles schema creation


**Health Check:**
Once running, verify the server is working:
```bash
curl http://localhost:5000/api/health
```


The Python services provide AI-powered features including an intelligent chatbot and automated quiz generation.

### Python – Full Setup

**Prerequisites:**
- Python 3.8 or higher
- pip package manager

**Setup Steps:**

1. Navigate to the python directory and install dependencies:
   ```bash
   cd python
   pip install -r requirements.txt
   ```

2. (Optional) Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # macOS/Linux
   # or
   venv\Scripts\activate     # Windows
   ```

3. Verify knowledge base file:
   - Ensure `majestic_realistic_knowledge_base.csv` exists in the `python/` directory
   - This CSV should contain columns: `_id, company_id, category, Question, Answer, keywords`

**Important Notes:**
- Obtain a Google API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- The same API key can be used for both `GOOGLE_API_KEY` and `GEMINI_API_KEY`

### Python – Running Python Components

#### Quiz Service

The quiz service generates multiple-choice questions from various content sources (YouTube videos, PDFs, images, or raw text).

**Start the quiz service:**
```bash
cd python
python quiz_service.py --serve
```

The service will be available at `http://localhost:8001`

**Endpoints:**
- `GET /health` - Health check
- `POST /ai` - Generate quiz questions

**Supported Input Types:**
- **YouTube URLs**: Extracts transcripts and generates questions
- **PDF Files**: Processes PDF content (text or scanned)
- **Image Files**: Analyzes images (PNG, JPG, etc.)
- **Raw Text**: Direct text input

#### Chatbot Service

The chatbot service provides an AI assistant that answers questions based on company-specific knowledge bases.

**Start the chatbot service:**
```bash
cd python
python chatbot_service.py --serve
```

The service will be available at `http://localhost:8002`

**Endpoints:**
- `GET /health` - Health check
- `POST /chat` - Send a chat message
- `POST /chat/reset` - Reset chat history

**Note**: The backend server should be configured to proxy requests to these Python services, or update the client/server code to point to the correct Python service URLs.

## Team Members

- Yara Ahmed
- Nadia Sibai
- Zainah Mabrouk
- Nour Jazaeri
- Lubaba Raed




**Access the application**:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`
   - Chatbot Service: `http://localhost:8002`
   - Quiz Service: `http://localhost:8001`



