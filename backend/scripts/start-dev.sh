#!/bin/bash

# CureCast Health API Development Startup Script

echo "🚀 Starting CureCast Health API Development Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Navigate to backend directory
cd "$(dirname "$0")/.."

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the backend directory."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env file exists, if not copy from example
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "📝 Creating .env file from .env.example..."
        cp .env.example .env
        echo "⚠️  Please update the MongoDB connection string in .env file"
    else
        echo "⚠️  No .env file found. Please create one with your MongoDB connection string."
    fi
fi

# Create logs directory if it doesn't exist
if [ ! -d "logs" ]; then
    mkdir logs
    echo "📁 Created logs directory"
fi

# Check MongoDB connection string
if grep -q "<password>" .env 2>/dev/null; then
    echo "⚠️  Please update the MongoDB password in .env file before starting the server"
    echo "   Edit the MONGODB_URI in .env and replace <password> with your actual password"
    exit 1
fi

echo "✅ All checks passed!"
echo "🌟 Starting development server with nodemon..."
echo "📊 Health check will be available at: http://localhost:3001/health"
echo "🏥 Health Vault API: http://localhost:3001/api/health-vault"
echo "⏰ Reminders API: http://localhost:3001/api/reminders"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the development server
npm run dev
