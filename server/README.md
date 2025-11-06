# Company Registration Form

A React-based company registration form with MongoDB integration for storing registration requests.

## Features

- **Multi-step Form**: Company Information → Admin Information
- **Form Validation**: Client-side validation for required fields
- **File Upload**: Company logo upload with 5MB limit
- **MongoDB Integration**: Stores data in `registration_request` collection
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, professional design matching the provided mockup

## Form Fields

### Company Information
- Company Name* (required)
- Description
- Branches
- Commercial Registration Number* (required)
- Tax Number (optional)
- Industry* (required)
- Company Size* (required)
- Company Logo (optional, max 5MB)
- LinkedIn Profile URL

### Admin Information
- First Name* (required)
- Last Name* (required)
- Email* (required, unique)
- Phone Number* (required)
- Position* (required)
- Password* (required, min 6 characters)
- Confirm Password* (required)

## Setup Instructions

### 1. Install Dependencies
```bash
cd my-app
npm install
```

### 2. Configure MongoDB
1. Copy `env.example` to `.env`
2. Update `MONGODB_URI` with your MongoDB Atlas connection string
3. Ensure your MongoDB cluster allows connections from your IP

### 3. Create Uploads Directory
```bash
mkdir uploads
```

### 4. Start the Server
```bash
npm start
```

The application will be available at `http://localhost:5000`

## MongoDB Schema

The `registration_request` collection stores the following fields:

```javascript
{
  // Company Information
  companyName: String (required),
  description: String,
  branches: String,
  commercialRegistrationNumber: String (required),
  taxNumber: String,
  industry: String (required),
  companySize: String (required),
  companyLogo: String, // File path
  linkedinProfileUrl: String,
  
  // Admin Information
  adminFirstName: String (required),
  adminLastName: String (required),
  adminEmail: String (required, unique),
  adminPhone: String (required),
  adminPosition: String (required),
  adminPassword: String (required),
  
  // Metadata
  status: String (enum: ['pending', 'approved', 'rejected'], default: 'pending'),
  submittedAt: Date (default: Date.now),
  reviewedAt: Date,
  reviewedBy: String,
  notes: String
}
```

## API Endpoints

- `GET /api/registration-requests` - Get all registration requests
- `GET /api/registration-requests/:id` - Get single registration request
- `POST /api/registration-requests` - Create new registration request
- `PATCH /api/registration-requests/:id` - Update registration request status
- `DELETE /api/registration-requests/:id` - Delete registration request

## Development

### Frontend Only (No Backend)
To run just the frontend without the backend:
```bash
cd my-app/public
python -m http.server 3000
# or
npx serve --listen 3000
```

### Full Stack Development
```bash
npm run dev
```

## File Structure

```
my-app/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Button.js
│   │   ├── Navbar.js
│   │   └── Footer.js
│   ├── pages/
│   │   ├── CompanyRegistration.js
│   │   ├── Home.js
│   │   ├── Login.js
│   │   └── Profile.js
│   ├── styles/
│   │   └── Registration.css
│   ├── App.js
│   └── index.js
├── uploads/ (created when server runs)
├── server.js
├── package.json
├── env.example
└── README.md
```

## Security Notes

- Passwords are stored in plain text (hash them in production)
- Add authentication middleware for admin endpoints
- Implement rate limiting for form submissions
- Add CSRF protection
- Validate file uploads more strictly
