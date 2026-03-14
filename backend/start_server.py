#!/usr/bin/env python3
"""
Startup script for MelodAI Backend Server
"""

import os
import sys
import subprocess

def check_requirements():
    """Check if required packages are installed"""
    try:
        import flask
        import torch
        import torchaudio
        import audiocraft
        import pydub
        import openai
        print("✅ All required packages are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing package: {e}")
        print("📦 Please install requirements: pip install -r requirements.txt")
        return False

def check_env_file():
    """Check if .env file exists with OpenAI API key"""
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')  # Look in root directory
    if not os.path.exists(env_path):
        print("⚠️  .env file not found in root directory!")
        print("📝 Please create a .env file in the root directory with your OpenAI API key:")
        print("   OPENAI_API_KEY=your_api_key_here")
        return False
    
    with open(env_path, 'r') as f:
        content = f.read()
        if 'OPENAI_API_KEY' not in content:
            print("⚠️  OPENAI_API_KEY not found in .env file!")
            return False
    
    print("✅ Environment configuration found")
    return True

def main():
    print("🎵 MelodAI Backend Server Startup")
    print("=" * 40)
    
    # Check requirements
    if not check_requirements():
        sys.exit(1)
    
    # Check environment
    if not check_env_file():
        sys.exit(1)
    
    # Start server
    print("\n🚀 Starting Flask server...")
    print("🔗 Frontend should connect to: http://localhost:5000")
    print("📊 Health check: http://localhost:5000/api/health")
    print("\n⏳ Loading AI models (this may take a moment)...")
    print("=" * 40)
    
    try:
        import sys
        import os
        
        # Add the parent directory to Python path so we can import backend modules
        parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        sys.path.insert(0, parent_dir)
        
        from backend.server import app
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=False,
            threaded=True
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()