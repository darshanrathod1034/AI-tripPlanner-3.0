# 🧠 AI Trip Planner

> **Your intelligent travel companion** - Generate optimized, day-wise travel itineraries powered by AI and smart routing algorithms.

Plan your perfect trip in minutes! Just enter your destination, dates, budget, and interests - our AI handles the rest by creating optimized routes that minimize travel time and maximize your experience.

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/darshanrathod1034/AI-tripPlanner-3.0)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Setup](#local-setup)
  - [Docker Setup](#docker-setup)
- [Environment Variables](#-environment-variables)
- [Usage Guide](#-usage-guide)
- [AI Trip Generation Logic](#-ai-trip-generation-logic)
- [API Endpoints](#-api-endpoints)
- [Screenshots](#-screenshots)
- [Future Scope](#-future-scope)
- [Authors](#-authors)

---

## 🌟 Overview

**AI Trip Planner** is a full-stack web application that revolutionizes travel planning by using artificial intelligence and optimization algorithms to create perfect itineraries. 

### 💡 Problem Statement

Planning trips manually is time-consuming and inefficient. Most travel platforms show popular attractions but fail to optimize routes, leading to wasted time and money on transportation.

### ✨ Our Solution

Our AI-powered platform:
- Generates **day-wise optimized itineraries** based on your preferences
- Uses **smart clustering algorithms** to group nearby attractions
- Implements **route optimization** to minimize travel time and costs
- Provides **interactive maps** with color-coded day markers
- Includes a **social community** for sharing travel experiences

---

## 🎯 Key Features

### 🤖 AI-Powered Trip Generation
- **Smart Itinerary Creation**: Input destination, dates, budget, and interests
- **Intelligent Place Selection**: Fetches top-rated attractions (rating ≥ 3.5)
- **Route Optimization**: Uses Nearest Neighbor algorithm (TSP approximation)
- **Daily Clustering**: Groups 2-4 nearby places per day (max distance ≤ 20km)
- **Multi-day Planning**: Routes end where the next day begins

### 🗺️ Interactive Map Integration
- **Google Maps Integration**: Real-time map visualization
- **Color-Coded Markers**: Different colors for each day
- **Live Directions**: Click markers to open in Google Maps
- **Distance Matrix**: Accurate travel time and distance calculations

### 🔐 Secure Authentication
- **JWT-based Sessions**: Secure token-based authentication
- **Password Encryption**: bcrypt hashing for password security
- **OTP Verification**: Email-based OTP for account verification
- **Cookie Management**: Secure cookie-based session handling

### 👥 Social Features
- **Explore Feed**: Browse travel posts from the community
- **Create Posts**: Share your travel experiences with photos
- **Rate Places**: Review and rate visited locations
- **User Profiles**: Personalized dashboards and trip history

### 📱 User-Friendly Interface
- **Responsive Design**: Works seamlessly on all devices
- **Modern UI**: Built with TailwindCSS and Framer Motion
- **Interactive Forms**: Easy-to-use trip creation wizard
- **Real-time Updates**: Live feedback and notifications

---

## 🚀 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React.js** | UI framework with hooks and context |
| **Vite** | Fast build tool and dev server |
| **TailwindCSS** | Utility-first CSS framework |
| **Framer Motion** | Smooth animations and transitions |
| **React Router** | Client-side routing |
| **Axios** | HTTP client for API calls |
| **React Google Maps API** | Map integration |
| **Lucide React** | Modern icon library |
| **React Toastify** | Toast notifications |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime |
| **Express.js** | Web application framework |
| **MongoDB** | NoSQL database |
| **Mongoose** | MongoDB object modeling |
| **JWT** | Token-based authentication |
| **bcrypt** | Password hashing |
| **Nodemailer** | Email service for OTP |
| **Multer** | File upload handling |
| **Cloudinary** | Image storage and CDN |

### APIs & Services
- **Google Maps API**: Geocoding and map display
- **Google Distance Matrix API**: Travel time calculations
- **Google Places API**: Attraction data and ratings
- **Unsplash API**: High-quality travel images

### DevOps
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Frontend web server
- **Nodemon**: Development auto-restart

---

## 📐 System Architecture

```
┌─────────────────┐
│  React Frontend │
│   (Port 80)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Axios Client   │
│   (HTTP/HTTPS)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Express Backend │
│   (Port 3000)   │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼
┌────────┐ ┌──────┐ ┌────────┐ ┌──────────┐
│  Auth  │ │ Trip │ │ Places │ │   User   │
│ Routes │ │  AI  │ │ Routes │ │  Routes  │
└───┬────┘ └──┬───┘ └───┬────┘ └────┬─────┘
    │         │         │           │
    └─────────┴─────────┴───────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
    ┌─────────┐      ┌──────────────┐
    │ MongoDB │      │ Google APIs  │
    │ Database│      │ - Maps       │
    └─────────┘      │ - Places     │
                     │ - Distance   │
                     └──────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v6 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** or **yarn** - Comes with Node.js
- **Docker** (optional, for containerized deployment) - [Download](https://www.docker.com/)

### API Keys Required

You'll need to obtain the following API keys:

1. **Google Cloud Platform APIs**:
   - Google Maps JavaScript API
   - Google Places API
   - Google Distance Matrix API
   - [Get API Keys](https://console.cloud.google.com/)

2. **Cloudinary** (for image uploads):
   - [Sign up for free](https://cloudinary.com/)

3. **Email Service** (for OTP):
   - Gmail account with App Password
   - [Setup Guide](https://support.google.com/accounts/answer/185833)

---

## 💻 Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/darshanrathod1034/AI-tripPlanner-3.0.git
cd AI-tripPlanner-3.0
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Or create manually (see Environment Variables section)

# Start MongoDB (if not running)
# On Windows: Start MongoDB service from Services
# On Mac/Linux: sudo systemctl start mongod

# Run backend server
npm start
# Or for development with auto-reload:
npm run dev:server
```

Backend will run on `http://localhost:3000`

### 3. Frontend Setup

```bash
# Open a new terminal
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Add your Google Maps API key

# Run frontend development server
npm run dev
```

Frontend will run on `http://localhost:5173` (Vite default)

### 4. Access the Application

Open your browser and navigate to:
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000`

---

## 🐳 Docker Setup

### Using Docker Compose (Recommended)

This method runs both frontend and backend in containers:

```bash
# Make sure you're in the root directory
cd AI-tripPlanner-3.0

# Create .env files for both frontend and backend
# (See Environment Variables section)

# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Access the application**:
- **Frontend**: `http://localhost` (port 80)
- **Backend**: `http://localhost:3000`

### Individual Docker Containers

**Backend only**:
```bash
cd backend
docker build -t trip-planner-backend .
docker run -p 3000:3000 --env-file .env trip-planner-backend
```

**Frontend only**:
```bash
cd frontend
docker build -t trip-planner-frontend .
docker run -p 80:80 trip-planner-frontend
```

---

## 🔐 Environment Variables

### Backend `.env` Configuration

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/trip-planner
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/trip-planner

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Google APIs
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
GOOGLE_PLACES_API_KEY=your-google-places-api-key

# Cloudinary (Image Upload)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Email Service (for OTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Session Secret
SESSION_SECRET=your-session-secret-key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env` Configuration

Create a `.env` file in the `frontend` directory:

```env
# API Configuration
VITE_API_URL=http://localhost:3000

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

---

## 📖 Usage Guide

### 1. Create an Account

1. Click **Sign Up** on the homepage
2. Enter your email, username, and password
3. Verify your email with the OTP sent to your inbox
4. Log in with your credentials

### 2. Generate a Trip

1. Click **Create Trip** from the dashboard
2. Fill in the trip details:
   - **Destination**: City or location name
   - **Start Date**: Trip start date
   - **End Date**: Trip end date
   - **Budget**: Your budget range
   - **Interests**: Select your preferences (adventure, culture, food, etc.)
3. Click **Generate Itinerary**
4. Wait for AI to create your optimized trip plan

### 3. View Your Itinerary

- **Day-wise breakdown**: See places organized by day
- **Interactive map**: View all locations with color-coded markers
- **Place details**: Click on places to see descriptions, ratings, and photos
- **Get directions**: Click markers to open in Google Maps

### 4. Explore Community

- Browse travel posts from other users
- Rate and review places you've visited
- Share your own travel experiences with photos
- Save favorite places for future trips

### 5. Manage Your Trips

- View all your trips in **My Trips**
- Edit or delete existing trips
- Save places to your favorites
- Export itineraries (coming soon)

---

## 🧠 AI Trip Generation Logic

### Step-by-Step Process

```
1. User Input
   ├─ Destination (e.g., "Paris")
   ├─ Dates (e.g., 5 days)
   ├─ Budget (e.g., $1000-2000)
   └─ Interests (e.g., culture, food)

2. Geocoding
   └─ Convert destination to coordinates (lat/lng)

3. Place Discovery
   ├─ Query Google Places API
   ├─ Filter by rating ≥ 3.5
   ├─ Match user interests
   └─ Get top 20-30 attractions

4. Distance Calculation
   ├─ Use Google Distance Matrix API
   ├─ Calculate distances between all places
   └─ Build distance matrix

5. Daily Clustering
   ├─ Group nearby places (≤ 20km apart)
   ├─ Assign 2-4 places per day
   └─ Balance across trip duration

6. Route Optimization
   ├─ Apply Nearest Neighbor algorithm
   ├─ Minimize total travel distance
   └─ Ensure day N ends near day N+1 start

7. Itinerary Generation
   ├─ Create day-wise schedule
   ├─ Add place details, timings
   ├─ Calculate estimated costs
   └─ Save to database

8. Return to User
   └─ Display interactive itinerary with map
```

### Optimization Algorithms

- **Clustering**: K-means inspired grouping by geographic proximity
- **Routing**: Nearest Neighbor heuristic for TSP
- **Multi-day**: Greedy approach to connect days efficiently

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - User login
POST   /api/auth/verify-otp        - Verify OTP
POST   /api/auth/logout            - User logout
GET    /api/auth/check-session     - Check if user is logged in
```

### Trip Management
```
POST   /api/ai/generate-trip       - Generate AI trip itinerary
GET    /api/user/trips             - Get user's trips
GET    /api/user/trips/:id         - Get specific trip
PUT    /api/user/trips/:id         - Update trip
DELETE /api/user/trips/:id         - Delete trip
```

### Places & Posts
```
GET    /api/places                 - Get all places
POST   /api/places                 - Create place post
GET    /api/places/:id             - Get place details
POST   /api/places/:id/rate        - Rate a place
GET    /api/user/saved-places      - Get saved places
POST   /api/user/save-place        - Save a place
```

### User Profile
```
GET    /api/user/profile           - Get user profile
PUT    /api/user/profile           - Update profile
POST   /api/user/upload-avatar     - Upload profile picture
```

---

## 📸 Screenshots

### Home Page
![Home Page](screenshots/home.png)

### Trip Creation Form
![Trip Form](screenshots/trip-form.png)

### AI-Generated Itinerary
![Itinerary](screenshots/itinerary.png)

### Interactive Map
![Map View](screenshots/map.png)

### Community Explore Feed
![Explore Feed](screenshots/explore.png)

---

## 🎯 Future Scope

- 🤖 **Collaborative Filtering**: User-based recommendations
- 🧬 **Content-Based Filtering**: Suggestions using place features
- 📊 **Sentiment Analysis**: Analyze reviews for better recommendations
- 🗺️ **Dynamic Rescheduling**: Auto-adjust based on traffic/weather
- 💰 **Budget Tracking**: Real-time expense tracking
- 🌐 **Multi-language Support**: Internationalization
- 📱 **Mobile App**: Native iOS and Android apps
- 🎫 **Booking Integration**: Direct hotel and flight bookings
- 🤝 **Group Planning**: Collaborative trip planning
- 📊 **Analytics Dashboard**: Trip statistics and insights

---

## 🧑‍💻 Authors

| Name | Role | Contact |
|------|------|---------|
| **Deep Tandel** | Frontend Developer | [tandeldeep2909@gmail.com](mailto:tandeldeep2909@gmail.com) |
| **Darshan Rathod** | Backend Developer | [darshanrathod1034@gmail.com](mailto:darshanrathod1034@gmail.com) |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📬 Support

For questions, issues, or suggestions:

- 📧 Email: [darshanrathod1034@gmail.com](mailto:darshanrathod1034@gmail.com)
- 🐛 Issues: [GitHub Issues](https://github.com/darshanrathod1034/AI-tripPlanner-3.0/issues)

---

## ⭐ Show Your Support

If you find this project helpful, please give it a ⭐ on [GitHub](https://github.com/darshanrathod1034/AI-tripPlanner-3.0)!

---

**Made with ❤️ by Deep Tandel and Darshan Rathod**