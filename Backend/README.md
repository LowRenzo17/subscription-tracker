# Subscription Tracker API - Backend

This is the backend service for the Subscription Tracker application. It provides a RESTful API to manage users, track subscriptions, and automate email reminders for upcoming renewals using Upstash Workflow and Nodemailer.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (with Mongoose ORM)
- **Authentication:** JSON Web Tokens (JWT) & bcrypt
- **Security & Bot Detection:** Arcjet
- **Background Jobs & Workflows:** Upstash Workflow
- **Email Delivery:** Nodemailer

## Project Structure

```
Backend/
├── config/         # Configuration files (Database, Environment variables, Upstash, Nodemailer)
├── controllers/    # Route controllers handling the business logic
├── database/       # Database connection setup
├── middlewares/    # Custom middlewares (Authentication, Error handling, Arcjet)
├── models/         # Mongoose schema definitions
├── routes/         # Express API route definitions
├── utils/          # Utility functions (Email templates, helpers)
├── server.js       # Express application setup and entry point
└── .env            # Environment variables (Ignored in Git)
```

## Setup & Installation

**1. Install Dependencies**
```bash
npm install
```

**2. Environment Variables**
Create a `.env` file in the root of the `Backend/` directory. Use the following template:

```env
PORT=5000
SERVER_URL="http://localhost:5000"
NODE_ENV=development

# Database
DB_URI="mongodb://localhost:27017/subscription-tracker"

# JWT Authentication
JWT_SECRET="your_jwt_secret_key"
JWT_EXPIRES_IN="1d"

# Arcjet (Security & Bot Protection)
ARCJET_KEY="your_arcjet_key"
ARCJET_ENV="development"

# Upstash QStash (For local testing of workflows)
QSTASH_URL="http://127.0.0.1:8080"
QSTASH_TOKEN="eyJVc2VySUQiOiJkZWZhdWx0VXNlciIsIlBhc3N3b3JkIjoiZGVmYXVsdFBhc3N3b3JkIn0="

# Nodemailer setup (ex. App Passwords for Gmail)
EMAIL_PASSWORD="your_email_app_password"
```

**3. Run the Development Server**
```bash
npm run dev
```

**4. Run Upstash local server (For workflows/email reminders)**
Open a separate terminal in the `Backend/` folder and start the local QStash simulator:
```bash
npx @upstash/qstash-cli serve
```

---

## API Documentation

The API uses `/api/v1` as the base path.

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/signup` | Register a new user account |
| POST | `/signin` | Login to access the API |
| POST | `/signout` | Logout user |

### Subscriptions (`/api/v1/subscriptions`)
**Note:** All of these routes require a valid `Bearer Token` in the Authorization header.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get all subscriptions across the system |
| GET | `/user/:id` | Get all subscriptions belonging to a user |
| GET | `/:id` | Get single subscription details |
| POST | `/create` | Create a new subscription (Also triggers email workflow) |
| PUT | `/update/:id` | Update an existing subscription |
| PUT | `/:id/cancel` | Cancel a subscription (sets status to 'cancelled') |
| DELETE| `/delete/:id` | Delete a subscription |
| GET | `/upcoming-renewals`| Get upcoming renewals |

### Workflows (`/api/v1/workflows`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/subscriptions/reminders` | Upstash endpoint for scheduling automated reminder emails. |

---

## Features

1. **User Authentication:** Secure user signup and login via JWT cookies or Bearer tokens. Password hashing is handled securely with bcrypt.
2. **Subscription Management:** Users can track their active subscriptions, view costs, and categorize expenses (e.g., Entertainment, Lifestyle, News).
3. **Automated Reminders:** When a user creates a subscription, an Upstash workflow is triggered. This workflow will "sleep" and automatically trigger Nodemailer to send emails exactly `7`, `5`, `2`, and `1` days before the user's subscription renewal date. 
4. **Arcjet Security:** Implemented middleware to protect endpoints from bot activity and spam.
