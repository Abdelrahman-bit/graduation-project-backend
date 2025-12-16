<p align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/server.svg" width="100" alt="Backend Logo" />
</p>

<h1 align="center">Eduraa Backend API</h1>

<p align="center">
  <strong>Powerful REST API powering the Eduraa online learning platform</strong>
</p>

<p align="center">
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-reference">API Reference</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white" alt="Mongoose" />
  <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI" />
</p>

---

## ✨ Overview

The **Eduraa Backend** is a robust, scalable REST API built with Express.js and MongoDB that powers the Eduraa online learning platform. It features AI-powered chatbot capabilities with RAG (Retrieval-Augmented Generation), real-time messaging via Ably, and comprehensive course management for students, instructors, and administrators.

---

## 🛠 Tech Stack

| Category | Technologies |
|----------|-------------|
| **Runtime** | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) |
| **Framework** | ![Express](https://img.shields.io/badge/Express_5.1-000000?style=flat-square&logo=express&logoColor=white) |
| **Database** | ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white) ![Mongoose](https://img.shields.io/badge/Mongoose_9.0-880000?style=flat-square&logo=mongoose&logoColor=white) |
| **AI & ML** | ![OpenAI](https://img.shields.io/badge/OpenAI_GPT--4o--mini-412991?style=flat-square&logo=openai&logoColor=white) ![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=flat-square&logo=langchain&logoColor=white) |
| **Vector DB** | ![Pinecone](https://img.shields.io/badge/Pinecone-000000?style=flat-square&logoColor=white) |
| **Real-Time** | ![Ably](https://img.shields.io/badge/Ably-FF5416?style=flat-square&logo=ably&logoColor=white) |
| **Media** | ![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white) |
| **Auth** | ![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white) ![bcrypt](https://img.shields.io/badge/bcrypt-4A154B?style=flat-square&logoColor=white) |

---

## 🚀 Features

### 🎓 Core Platform
- **Multi-Role System** – Students, Instructors, and Admins with granular permissions
- **Course Management** – Full CRUD operations with approval workflow
- **Enrollment System** – Request-based and direct enrollment options
- **Progress Tracking** – Lecture completion and course progress monitoring
- **Wishlist** – Save courses for later

### 🤖 AI-Powered Chatbot
- **GPT-4o-mini Integration** – Intelligent conversational AI assistant
- **RAG (Retrieval-Augmented Generation)** – Context-aware responses from course content
- **Role-Based Tools** – Different AI capabilities per user role:
  - 📚 **Students**: Get enrollments, track progress
  - 👨‍🏫 **Instructors**: View stats, check course approval
  - 👑 **Admins**: Platform-wide analytics

### 💬 Real-Time Features
- **Course Chat Groups** – Live messaging within courses
- **Instant Notifications** – Push notifications via Ably
- **Live Updates** – Course approval/rejection alerts

### 🏛 Hall Booking System
- **Hall Management** – Create and manage labs/halls
- **Slot System** – Define available time slots
- **Booking Requests** – Reserve spaces for sessions

### 🛡 Security
- **JWT Authentication** – Secure token-based auth
- **Password Hashing** – bcrypt with 12 salt rounds
- **Rate Limiting** – 1000 requests/hour per IP
- **Helmet Integration** – Secure HTTP headers
- **CORS Protection** – Cross-origin request security

---

## 🏗 Architecture

```
📦 backend/
├── 📄 server.js              # Entry point & MongoDB connection
├── 📄 app.js                 # Express app configuration
├── 📄 config.env             # Environment variables
│
├── 📂 controller/            # Request handlers (16 controllers)
│   ├── authControllers.js    # Login, register, password reset
│   ├── adminControllers.js   # User management, course approval
│   ├── instructorControllers.js
│   ├── studentControllers.js
│   ├── courseControllers.js
│   ├── aiController.js       # AI chatbot handler
│   ├── chatController.js     # Course messaging
│   ├── bookingControllers.js
│   └── ...
│
├── 📂 middleware/            # Express middleware
│   ├── authentication.js     # JWT verification
│   ├── authorization.js      # Role-based access control
│   ├── errorHandler.js       # Global error handling
│   └── rateLimiting.js       # Request throttling
│
├── 📂 models/                # Mongoose schemas (13 models)
│   ├── usersModel.js
│   ├── courseModel.js
│   ├── enrollmentModel.js
│   └── ...
│
├── 📂 routes/                # API route definitions (16 routes)
│
├── 📂 services/              # Business logic layer
│   └── ai/                   # AI-specific services
│       ├── chatService.js    # Main AI chat handler
│       ├── embeddingService.js
│       ├── ragService.js     # Retrieval-Augmented Generation
│       ├── pineconeClient.js # Vector DB connection
│       ├── openaiClient.js   # OpenAI configuration
│       └── tools/            # AI function calling tools
│           ├── studentTools.js
│           ├── instructorTools.js
│           └── adminTools.js
│
├── 📂 utils/                 # Helper utilities
│   ├── appError.js
│   ├── email.js              # Nodemailer configuration
│   └── ...
│
└── 📂 seeders/               # Database seeding scripts
```

---

## ⚡ Getting Started

### Prerequisites

- **Node.js** v18+ recommended
- **MongoDB** Atlas or local instance
- **Pinecone** account for vector storage
- **OpenAI** API key
- **Cloudinary** account for media
- **Ably** account for real-time features

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd backend

# Install dependencies
npm install
```

### Environment Setup

Create a `config.env` file based on the required variables:

```env
# Database
MONGODB_URL=mongodb+srv://...
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Authentication
JWT_SECRET=your_jwt_secret_key

# AI Configuration
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX=your_index_name

# Media Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_secret

# Real-Time
ABLY_API_KEY=your_ably_key

# Email
EMAIL_USERNAME=your_email
EMAIL_PASSWORD=your_app_password
```

### Running the Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

The server will start at `http://localhost:5000` by default.

---

## 📚 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | User login |
| `POST` | `/api/auth/register` | User registration |
| `POST` | `/api/auth/forgotPassword` | Send reset email |
| `PATCH` | `/api/auth/resetPassword/:token` | Reset password |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/courses` | Get all published courses |
| `GET` | `/api/courses/:slug` | Get course details |
| `POST` | `/api/courses` | Create new course (Instructor) |
| `PATCH` | `/api/courses/:id` | Update course |

### Student
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/student/enrollments` | Get enrolled courses |
| `POST` | `/api/student/enroll/:courseId` | Enroll in course |
| `PATCH` | `/api/student/progress` | Update progress |
| `GET` | `/api/student/wishlist` | Get wishlist |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/users` | Get all users |
| `GET` | `/api/admin/courses/pending` | Get pending courses |
| `PATCH` | `/api/admin/courses/:id/approve` | Approve course |
| `PATCH` | `/api/admin/courses/:id/reject` | Reject course |

### AI Chatbot
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Send message to AI |
| `GET` | `/api/ably/auth` | Get Ably token |

> 📖 For complete API documentation, refer to `API_DOCUMENTATION.md`

---

## 🔐 Security Features

| Feature | Implementation |
|---------|---------------|
| **Password Hashing** | bcrypt with 12 salt rounds |
| **Token Authentication** | JWT with secure signing |
| **Rate Limiting** | 1000 req/hour per IP |
| **Security Headers** | Helmet middleware |
| **CORS** | Configurable cross-origin policies |
| **Input Validation** | Validator & Zod schemas |
| **Error Handling** | Centralized error handler |

---

## 📦 Dependencies

### Core
```json
"express": "^5.1.0",
"mongoose": "^9.0.0",
"dotenv": "^17.2.3"
```

### AI & ML
```json
"ai": "^5.0.108",
"@ai-sdk/openai": "^2.0.80",
"@pinecone-database/pinecone": "^6.1.3",
"langchain": "^1.1.5"
```

### Security
```json
"helmet": "^8.1.0",
"bcrypt": "^6.0.0",
"jsonwebtoken": "^9.0.2",
"express-rate-limit": "^8.2.1"
```

### External Services
```json
"cloudinary": "^2.8.0",
"ably": "^2.15.0",
"nodemailer": "^7.0.11"
```

---

## 🧪 Development

```bash
# Run with hot reload
npm run dev

# Lint code
npm run lint

# Format code
npm run format
```

---

## 📄 License

This project is part of the **Eduraa** online learning platform.

---

<p align="center">
  Made with ❤️ by the Eduraa Team
</p>
