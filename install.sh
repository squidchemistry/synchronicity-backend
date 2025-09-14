#!/bin/bash

echo "🚀 Installing Synchronicity Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or later."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or later is required. Current version: $(node -v)"
    exit 1
fi

# Check if MongoDB is available
if ! command -v mongod &> /dev/null; then
    print_warning "MongoDB is not installed locally. Please ensure MongoDB is running or update the connection string in server/.env"
fi

print_status "Installing root dependencies..."
npm install

print_status "Installing server dependencies..."
cd server && npm install
cd ..

print_status "Installing client dependencies..."
cd client && npm install
cd ..

print_status "Setting up environment files..."

# Create server .env file if it doesn't exist
if [ ! -f "server/.env" ]; then
    cp server/.env.example server/.env
    print_status "Created server/.env file. Please update it with your configuration."
else
    print_warning "server/.env already exists. Please ensure it's properly configured."
fi

# Create client .env file if it doesn't exist
if [ ! -f "client/.env" ]; then
    cp client/.env.example client/.env
    print_status "Created client/.env file."
else
    print_warning "client/.env already exists."
fi

print_status "Building TypeScript for server..."
cd server && npm run build
cd ..

echo ""
echo -e "${GREEN}✅ Installation complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "1. Update server/.env with your configuration:"
echo "   - MongoDB connection string"
echo "   - JWT secret key"
echo "   - OpenAI API key (optional, for AI features)"
echo "   - CoinGecko API key (optional, for enhanced rate limits)"
echo ""
echo "2. Start MongoDB (if running locally):"
echo "   mongod"
echo ""
echo "3. Start the development servers:"
echo "   npm run dev"
echo ""
echo "4. Open your browser and navigate to:"
echo "   http://localhost:5173"
echo ""
echo "🎉 Welcome to Synchronicity Platform!"
echo "Your AI & Cryptocurrency platform is ready to use."