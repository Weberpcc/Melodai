#!/bin/bash

echo "Setting up MelodAI Frontend..."
echo

echo "Installing dependencies..."
npm install

echo
echo "Installing OGL for galaxy background..."
npm install ogl

echo
echo "Installing Lucide React for icons..."
npm install lucide-react

echo
echo "Setup complete! You can now run:"
echo "  npm start    - Start development server"
echo "  npm build    - Build for production"
echo