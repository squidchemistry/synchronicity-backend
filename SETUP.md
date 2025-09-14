# Synchronicity Platform - Setup Guide

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **MongoDB** - [Download here](https://www.mongodb.com/try/download/community) or use MongoDB Atlas
- **Git** - [Download here](https://git-scm.com/)

### Installation

1. **Clone and setup the project:**
   ```bash
   # Run the automated installation script
   ./install.sh
   ```

2. **Configure environment variables:**
   
   **Server Configuration (`server/.env`):**
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # Database
   MONGODB_URI=mongodb://localhost:27017/synchronicity

   # Authentication
   JWT_SECRET=your_super_secure_jwt_secret_key_here
   JWT_EXPIRES_IN=7d

   # External APIs
   COINGECKO_API_KEY=your_coingecko_api_key_here  # Optional
   OPENAI_API_KEY=your_openai_api_key_here        # Optional

   # CORS
   CORS_ORIGIN=http://localhost:5173
   ```

   **Client Configuration (`client/.env`):**
   ```env
   VITE_API_URL=http://localhost:3001
   VITE_SOCKET_URL=http://localhost:3001
   ```

3. **Start the application:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## 🔧 Manual Installation

If you prefer to install manually:

1. **Install root dependencies:**
   ```bash
   npm install
   ```

2. **Install server dependencies:**
   ```bash
   cd server && npm install && cd ..
   ```

3. **Install client dependencies:**
   ```bash
   cd client && npm install && cd ..
   ```

4. **Build the server:**
   ```bash
   cd server && npm run build && cd ..
   ```

## 📊 Database Setup

### Local MongoDB

1. **Install MongoDB Community Edition**
2. **Start MongoDB:**
   ```bash
   mongod
   ```
3. **The application will automatically create the database and collections**

### MongoDB Atlas (Cloud)

1. **Create a MongoDB Atlas account**
2. **Create a new cluster**
3. **Get your connection string**
4. **Update `MONGODB_URI` in `server/.env`**

## 🔑 API Keys Setup

### CoinGecko API (Optional)

1. **Sign up at [CoinGecko](https://www.coingecko.com/en/api)**
2. **Get your API key**
3. **Add to `server/.env` as `COINGECKO_API_KEY`**

**Note:** The app works without this key but with rate limits.

### OpenAI API (Optional)

1. **Sign up at [OpenAI](https://platform.openai.com/)**
2. **Get your API key**
3. **Add to `server/.env` as `OPENAI_API_KEY`**

**Note:** AI features will be disabled without this key.

## 🛠️ Development Commands

### Root Level
```bash
npm run dev          # Start both client and server in development mode
npm run build        # Build the client for production
npm run start        # Start the server in production mode
npm run install:all  # Install all dependencies
```

### Server (`cd server`)
```bash
npm run dev          # Start server in development mode with hot reload
npm run build        # Build TypeScript to JavaScript
npm start            # Start server in production mode
npm test             # Run tests
```

### Client (`cd client`)
```bash
npm run dev          # Start client development server
npm run build        # Build client for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🐳 Docker Setup (Optional)

Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    container_name: synchronicity-mongo
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: synchronicity

  app:
    build: .
    container_name: synchronicity-app
    restart: unless-stopped
    ports:
      - "3001:3001"
      - "5173:5173"
    depends_on:
      - mongodb
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/synchronicity
    volumes:
      - .:/app
      - /app/node_modules
      - /app/server/node_modules
      - /app/client/node_modules

volumes:
  mongodb_data:
```

Then run:
```bash
docker-compose up -d
```

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Kill process on port 3001
   lsof -ti:3001 | xargs kill -9
   
   # Kill process on port 5173
   lsof -ti:5173 | xargs kill -9
   ```

2. **MongoDB connection error:**
   - Ensure MongoDB is running
   - Check the connection string in `.env`
   - For Atlas, ensure IP is whitelisted

3. **API key errors:**
   - Verify API keys are correctly set in `.env`
   - Restart the server after adding keys

4. **Build errors:**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules server/node_modules client/node_modules
   npm run install:all
   ```

5. **TypeScript errors:**
   ```bash
   # Rebuild TypeScript
   cd server && npm run build
   ```

### Environment Issues

- **Windows users:** Use Git Bash or WSL for the install script
- **Node version:** Ensure Node.js 18+ is installed
- **Permission errors:** Run with appropriate permissions or use `sudo` (Linux/Mac)

## 📱 Production Deployment

### Build for Production

1. **Build the client:**
   ```bash
   cd client && npm run build
   ```

2. **Build the server:**
   ```bash
   cd server && npm run build
   ```

### Environment Variables for Production

Update your production `.env` files:

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
CORS_ORIGIN=https://yourdomain.com
```

### Deployment Options

- **Vercel** (Client) + **Railway** (Server)
- **Netlify** (Client) + **Heroku** (Server)
- **DigitalOcean App Platform**
- **AWS Amplify** + **AWS Lambda**
- **Self-hosted VPS**

## 🔐 Security Checklist

- [ ] Use strong JWT secret in production
- [ ] Enable CORS only for your domain
- [ ] Use HTTPS in production
- [ ] Keep API keys secure and rotate regularly
- [ ] Enable MongoDB authentication
- [ ] Use environment variables for sensitive data
- [ ] Regular security updates

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the logs in the terminal
3. Ensure all prerequisites are met
4. Verify environment variables are set correctly

## 🎉 You're Ready!

Your Synchronicity platform should now be running successfully. Enjoy exploring the features:

- 📊 Real-time cryptocurrency market data
- 💼 Portfolio tracking and analytics
- 🤖 AI-powered trading insights
- 💬 Community chat servers
- 🎨 Modern, responsive UI

Happy trading! 🚀