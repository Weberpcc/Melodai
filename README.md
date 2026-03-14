<<<<<<< HEAD
# MelodAI - AI Music Generation Platform

A full-stack application that generates music using AI based on text descriptions, mood, and context.

## Features

- 🎵 **AI Music Generation** - Create unique music from text descriptions
- 😊 **Mood Selection** - Choose from 8 different moods (Happy, Sad, Energetic, Calm, etc.)
- 🏷️ **Context Tags** - Specify use cases (Study, Party, Exercise, Sleep, etc.)
- ⚙️ **Advanced Settings** - Control creativity, duration, model selection, and more
- 🎛️ **Audio Post-Processing** - Professional effects, EQ, reverb, compression, and mastering
- 📊 **Audio Analysis** - Comprehensive spectral analysis, tempo/key detection, and quality metrics
- 💾 **Multi-Format Export** - Export to MP3, WAV, FLAC, OGG with quality settings
- 📱 **Responsive UI** - Beautiful glass-morphism design with real-time waveform visualization
- 📊 **Generation Progress** - Real-time feedback on generation stages
- 💾 **History & Favorites** - Save and manage your generated music

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Custom Components** for audio playback and waveform visualization

### Backend
- **Flask** REST API
- **PyTorch** & **AudioCraft** for music generation
- **OpenAI GPT** for prompt enhancement
- **Pydub** for audio processing

## Setup Instructions

### Prerequisites
- **Python 3.8+**
- **Node.js 16+**
- **OpenAI API Key**
- **CUDA GPU** (recommended for faster generation)

### Quick Start (From Root Directory)

1. **Install Python dependencies:**
   ```bash
   pip install -r backend/requirements.txt
   ```

2. **Create environment file:**
   ```bash
   # Create .env file in root directory
   echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
   ```

3. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Start both servers:**

   **Terminal 1 (Backend):**
   ```bash
   python backend/server.py
   ```

   **Terminal 2 (Frontend):**
   ```bash
   cd frontend
   npm start
   ```

   - Backend: `http://localhost:5000`
   - Frontend: `http://localhost:3000`

## Usage

1. **Open your browser** to `http://localhost:3000`
2. **Enter a music description** in the prompt field
3. **Select mood and context tags** (optional)
4. **Adjust settings** in the sidebar (duration, creativity, model)
5. **Click "Generate Music"** and wait for the AI to create your track
6. **Enhance your music** with professional audio effects:
   - Apply presets (Studio, Concert Hall, Bedroom)
   - Customize EQ, reverb, compression, and limiting
   - Analyze audio properties and frequency content
   - Export to multiple formats with quality settings
7. **Play, download, or favorite** your generated music

## API Endpoints

### Music Generation
- `POST /api/generate` - Generate music from prompt and settings
- `GET /api/audio/<filename>` - Serve generated audio files
- `GET /api/health` - Health check endpoint
- `GET /api/models` - List available AI models

### Audio Processing
- `POST /api/audio/enhance` - Apply effects and enhancement to audio
- `POST /api/audio/analyze` - Comprehensive audio analysis
- `POST /api/audio/convert` - Convert audio to different formats
- `POST /api/audio/preview-effect` - Preview effects on audio segments
- `POST /api/audio/compare` - A/B compare original vs processed audio
- `POST /api/audio/batch-export` - Batch export with effects and formats
- `GET /api/audio/presets` - Get available effect presets

## Example Prompts

- "A peaceful piano melody with soft strings, perfect for studying"
- "Upbeat electronic dance music with heavy bass and synthesizers"
- "Melancholic acoustic guitar with gentle rain sounds in the background"
- "Epic orchestral soundtrack with powerful brass and dramatic percussion"

## Configuration

### Frontend Settings
- **Duration:** 10-120 seconds
- **Creativity:** 0-100% (controls randomness)
- **Model:** Small (fast), Medium (balanced), Large (quality)
- **Advanced:** Top-K, Top-P, CFG Scale parameters

### Backend Parameters
All frontend settings are automatically mapped to backend parameters:
- Creativity → Temperature (0.5-1.5)
- Duration → Generation length
- Model selection → MusicGen model variant
- Advanced settings → Direct parameter mapping

## Troubleshooting

### Backend Issues
- **Model loading errors:** Ensure you have enough GPU/RAM memory
- **OpenAI API errors:** Check your API key in the `.env` file
- **Audio generation fails:** Try reducing duration or complexity

### Frontend Issues
- **CORS errors:** Ensure backend is running on port 5000
- **Audio playback issues:** Check browser audio permissions
- **Connection refused:** Verify backend server is running

## Development

### Project Structure
```
melodai/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── types/          # TypeScript definitions
│   │   └── App.tsx         # Main application
├── backend/                 # Python Flask backend
│   ├── server.py           # Flask server
│   ├── main_service.py     # Music generation pipeline
│   ├── input_processor.py  # LLM prompt processing
│   ├── music_generator.py  # AudioCraft integration
│   └── prompt_enhancer.py  # Prompt optimization
└── README.md
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- **Meta AudioCraft** for the MusicGen models
- **OpenAI** for GPT-based prompt enhancement
- **React & Tailwind** communities for excellent tooling
=======
# Melodai
MelodAI is an AI-driven music generation platform that converts text prompts into original music using deep learning models such as Meta MusicGen.  The system features a Flask-based backend, real-time generation progress via WebSockets, audio processing tools, and a modern web frontend for interactive music creation.
>>>>>>> ac24fcaa45e7f50accb10b7a7a1f02e4f1ca0c4a
