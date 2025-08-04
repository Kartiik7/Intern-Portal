#!/bin/bash

# Intern Portal Setup Script
# This script helps you set up the development environment

echo "🚀 Setting up Intern Portal..."
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v14 or higher) and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="14.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js v14 or higher."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION detected"

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB service."
    echo "   On Ubuntu/Debian: sudo systemctl start mongod"
    echo "   On macOS with Homebrew: brew services start mongodb-community"
    echo "   Or use Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Navigate to backend directory
cd backend

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    
    # Generate a random JWT secret
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    
    # Update .env file with generated secret
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your-super-secret-jwt-key-here/$JWT_SECRET/" .env
    else
        # Linux
        sed -i "s/your-super-secret-jwt-key-here/$JWT_SECRET/" .env
    fi
    
    echo "✅ Environment file created with random JWT secret"
    echo "📝 Please review and update .env file if needed"
else
    echo "✅ Environment file already exists"
fi

# Return to root directory
cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Start MongoDB if not already running"
echo "2. Start the backend server:"
echo "   cd backend && npm start"
echo ""
echo "3. In a new terminal, serve the frontend:"
echo "   cd frontend"
echo "   npx http-server -p 8080 -c-1"
echo "   # OR"
echo "   python -m http.server 8080"
echo ""
echo "4. Open your browser and navigate to:"
echo "   http://localhost:8080"
echo ""
echo "🔧 Development tips:"
echo "- Use 'npm run dev' in backend folder for auto-reload"
echo "- Check backend/.env for configuration"
echo "- View API documentation in README.md"
echo ""
echo "Happy coding! 🚀"
