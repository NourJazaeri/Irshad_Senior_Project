# Irshad

Irshad is a comprehensive employee and training management platform designed to streamline the learning process for modern organizations. The system facilitates company registration, role-based content management, real-time communication, and AI-powered learning assistance to help organizations effectively onboard and train their employees.

## Project Description

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
- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.2.2
- **Routing**: React Router DOM 7.9.1
- **Styling**: TailwindCSS 3.4.18
- **UI Components**: Lucide React (icons), React Icons
- **Charts**: Recharts 3.4.1
- **HTTP Client**: Axios 1.12.2
- **Real-Time**: Socket.io Client 4.7.5
- **PDF Generation**: jsPDF 3.0.4, html2canvas 1.4.1
- **Progress Indicators**: React Circular Progressbar 2.2.0

### Server
- **Runtime**: Node.js
- **Framework**: Express 5.1.0
- **Database**: MongoDB (via Mongoose 8.18.2)
- **Authentication**: JSON Web Tokens (jsonwebtoken 9.0.2), bcrypt 6.0.0
- **Real-Time**: Socket.io 4.8.1
- **File Upload**: Multer 1.4.5-lts.1, Cloudinary 1.41.3
- **Email**: Nodemailer 7.0.9
- **Other**: Cookie Parser, CORS, dotenv

### Python Services
- **Framework**: FastAPI 0.115.5
- **AI/ML**: 
  - Google Generative AI (google-generativeai 0.8.3)
  - LangChain 0.3.7 (with Google GenAI integration)
  - FAISS 1.9.0.post1 (vector database)
- **Content Processing**: 
  - pdfplumber 0.11.4 (PDF text extraction)
  - yt-dlp >=2024.10.7 (YouTube transcript extraction)
- **Data**: pandas 2.2.3, pymongo 4.10.1
- **Server**: Uvicorn 0.32.0

### Database
- **Primary Database**: MongoDB (via Mongoose ODM)

### Other Tools/Services
- **Authentication**: JWT-based authentication with role-based access control
- **File Storage**: Cloudinary for image/file hosting
- **Email Service**: Gmail SMTP via Nodemailer
- **Development**: ESLint, PostCSS, Autoprefixer

## Client

### Client – Installation Steps

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

3. (Optional) Configure environment variables:
   - The client uses Vite's proxy configuration to connect to the backend
   - Default proxy target: `http://localhost:5000`
   - No additional environment variables required for basic development

### Client – Running the Client

**Development Mode:**
```bash
npm run dev
```

The client will start on `http://localhost:5173` (or the next available port).

**Production Build:**
```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

**Preview Production Build:**
```bash
npm run preview
```

**Note**: The client is configured to proxy API requests to `http://localhost:5000` during development. Ensure the server is running for full functionality.

## Server

### Server – Installation Steps

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

3. Set up environment variables:
   Create a `.env` file in the `server/` directory with the following variables:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/irshad
   # Or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/irshad

   # Server Configuration
   PORT=5000
   NODE_ENV=development
   CLIENT_ORIGIN=http://localhost:5173,http://localhost:5174

   # Authentication
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # Email Service (Optional - for password reset and notifications)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-gmail-app-password
   ```

   **Important Notes:**
   - `JWT_SECRET`: Use a strong, random string in production
   - `MONGODB_URI`: Replace with your actual MongoDB connection string
   - `EMAIL_USER` and `EMAIL_PASS`: Required for email features. Use Gmail App Password (not regular password)
   - `CLIENT_ORIGIN`: Comma-separated list of allowed frontend origins

4. Create uploads directory (if it doesn't exist):
   ```bash
   mkdir -p uploads
   mkdir -p src/uploads
   ```

### Server – Running the Server

**Development Mode:**
```bash
npm run dev
```

This uses nodemon to automatically restart the server on file changes.

**Production Mode:**
```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in `PORT` environment variable).

**Database Setup:**
- The server automatically connects to MongoDB on startup
- No manual migrations required - Mongoose handles schema creation
- Optional migration scripts are available:
  ```bash
  npm run migrate:chat
  npm run migrate:todos
  npm run update:department-members
  ```

**Health Check:**
Once running, verify the server is working:
```bash
curl http://localhost:5000/api/health
```

## Python

The Python services provide AI-powered features including an intelligent chatbot and automated quiz generation.

### Python – Installation Steps

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

5. Set up environment variables:
   Create a `.env` file in the `python/` directory (or use the root `.env`):
   ```env
   # Google Gemini API Key (Required for both services)
   GOOGLE_API_KEY=your-google-api-key-here
   GEMINI_API_KEY=your-google-api-key-here

   # Chatbot Service Configuration (Optional)
   GEMINI_MODEL=gemini-2.0-flash
   GEMINI_EMBEDDING_MODEL=models/text-embedding-004
   KNOWLEDGE_BASE_PATH=./majestic_realistic_knowledge_base.csv
   MAX_HISTORY_MESSAGES=20
   MAX_HISTORY_AGE_HOURS=24
   ```

   **Important Notes:**
   - Obtain a Google API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - The same API key can be used for both `GOOGLE_API_KEY` and `GEMINI_API_KEY`
   - The knowledge base CSV file should be present in the `python/` directory

6. Verify knowledge base file:
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
└── docs/                   # Project documentation
```

## Getting Started (Full Setup)

To run the complete system:

1. **Start MongoDB** (if using local instance):
   ```bash
   mongod
   ```

2. **Start the Python services** (in separate terminals):
   ```bash
   cd python
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   python chatbot_service.py --serve --port 8002
   ```
   
   ```bash
   cd python
   source venv/bin/activate
   python quiz_service.py --serve
   ```

3. **Start the backend server**:
   ```bash
   cd server
   npm install
   npm run dev
   ```

4. **Start the frontend client**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

5. **Access the application**:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`
   - Chatbot Service: `http://localhost:8002`
   - Quiz Service: `http://localhost:8001`

## Additional Notes

- **Authentication**: The system uses JWT tokens stored in cookies/localStorage. Tokens expire and users must re-authenticate.
- **File Uploads**: Files are stored in the `server/uploads/` directory or uploaded to Cloudinary (if configured).
- **Real-Time Features**: Socket.io is used for real-time chat. Ensure WebSocket connections are allowed in your network/firewall.
- **CORS**: The server is configured to accept requests from specified origins. Update `CLIENT_ORIGIN` in `.env` if accessing from different domains.
- **Email Service**: Email features (password reset, notifications) require valid Gmail credentials with App Password enabled.

