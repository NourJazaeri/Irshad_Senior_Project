## Project Description

Irshad is a comprehensive employee and training management platform designed to streamline the learning process for modern organizations. The system facilitates company registration, role-based content management, real-time communication, and AI-powered learning assistance to help organizations effectively onboard and train their employees.

Irshad solves the challenge of managing employee onboarding and training at scale by providing a centralized platform where companies can register, organize their workforce into departments and groups, and deliver structured learning content to trainees. The platform features role-based access control, allowing different stakeholders (company admins, supervisors, and trainees) to interact with the system according to their responsibilities.

**Key Capabilities:**
- **Company Management**: Multi-tenant system supporting multiple companies with their own departments, groups, and users
- **Content Management**: Rich content library with support for various media types (PDFs, videos, images) and customizable templates
- **AI-Powered Learning**: Intelligent chatbot assistant powered by Google Gemini that helps trainees with company-specific questions
- **Quiz Generation**: Automated quiz creation from YouTube videos, PDFs, and images using AI
- **Real-Time Communication**: Live chat functionality between supervisors and trainees with notifications
- **Progress Tracking**: Analytics and dashboards for monitoring trainee progress and engagement
- **Task Management**: Todo lists and reminders to help trainees stay organized

## Who It's For

### Company Admins
Company administrators manage the overall company structure, including departments, groups, and user accounts. They can create and assign content, manage company profiles, and oversee all training activities within their organization.

### Supervisors
Supervisors are responsible for managing specific groups of trainees. They can create and share content with their groups, communicate with trainees via real-time chat, track individual trainee progress, and generate reports on group performance.

### Trainees / Employees
Trainees are the primary learners in the system. They access assigned content, interact with an AI chatbot for instant help, communicate with their supervisors, manage their todo lists, and track their own learning progress.

### Web Owners
Web owners operate at the platform level, managing company registration requests, approving or rejecting new company accounts, viewing platform-wide analytics, and overseeing all companies using the system.

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
- **File Storage**: Subase for image/file hosting
- **Email Service**: Gmail SMTP via Nodemailer
  

## Client

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


## Server

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


The server will start on `http://localhost:5000`


**Database Setup:**
- The server automatically connects to MongoDB on startup
- No manual migrations required - Mongoose handles schema creation


**Health Check:**
Once running, verify the server is working:
```bash
curl http://localhost:5000/api/health
```


## Python

The Python services provide AI-powered features including an intelligent chatbot and automated quiz generation.

### Python – Full Setup

**Prerequisites:**
- Python 3.8 or higher
- pip package manager

**Steps:**

1. Navigate to the python directory:
   ```bash
   cd python
   ```

2. (Recommended) Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - **macOS/Linux:**
     ```bash
     source venv/bin/activate
     ```
   - **Windows:**
     ```bash
     venv\Scripts\activate
     ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```


   **Important Notes:**
   - Obtain a Google API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - The same API key can be used for both `GOOGLE_API_KEY` and `GEMINI_API_KEY`
   - The knowledge base CSV file should be present in the `python/` directory

5. Verify knowledge base file:
   - Ensure `majestic_realistic_knowledge_base.csv` exists in the `python/` directory
   - This CSV should contain columns: `company_id`, `question`, `answer`

### Python – Running Python Components

#### Chatbot Service

The chatbot service provides an AI assistant that answers questions based on company-specific knowledge bases.

**Start the chatbot service:**
```bash
python chatbot_service.py --serve --port 8002
```

Or using uvicorn directly:
```bash
uvicorn chatbot_service:app --host 0.0.0.0 --port 8002
```

The service will be available at `http://localhost:8002`

**Endpoints:**
- `GET /health` - Health check
- `POST /chat` - Send a chat message
- `POST /chat/reset` - Reset chat history

**CLI Mode (for testing):**
```bash
python chatbot_service.py
```

#### Quiz Service

The quiz service generates multiple-choice questions from various content sources (YouTube videos, PDFs, images, or raw text).

**Start the quiz service:**
```bash
python quiz_service.py --serve
```

Or using uvicorn directly:
```bash
uvicorn quiz_service:app --host 0.0.0.0 --port 8001
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

**Note**: The backend server should be configured to proxy requests to these Python services, or update the client/server code to point to the correct Python service URLs.


## Team Members

- Yara Ahmed
- Nadia Sibai
- Zainah Mabrouk
- Nour Jazaeri
- Lubaba Raed


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

**Access the application**:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`
   - Chatbot Service: `http://localhost:8002`
   - Quiz Service: `http://localhost:8001`



