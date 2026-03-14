# MelodAI Frontend

A beautiful React frontend for the MelodAI music generation application, featuring a glassmorphism design with an animated galaxy background.

## Features

### 🎨 Design
- **Glassmorphism UI**: Modern glass-like design elements with backdrop blur effects
- **Animated Galaxy Background**: Interactive WebGL galaxy animation using OGL
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Dark Theme**: Optimized for low-light environments

### 🎵 Music Generation
- **Intuitive Prompt Input**: Large text area with character counting and validation
- **Mood Selection**: Choose from 8 different mood categories
- **Context Tags**: Select situational tags for better music generation
- **Example Prompts**: 25+ curated example prompts with shuffle functionality
- **Recent Prompts**: Quick access to your last 5 prompts

### 🎛️ Advanced Controls
- **Duration Control**: 10-120 seconds with visual slider
- **Creativity Control**: Adjust AI creativity from conservative to highly creative
- **Model Selection**: Choose between different MusicGen models
- **Expert Settings**: Advanced parameters (Top-K, Top-P, CFG Scale)

### 🎧 Audio Experience
- **Custom Audio Player**: Full-featured player with seek, volume, and skip controls
- **Waveform Visualization**: Real-time waveform generation and display
- **Download Support**: Download generated tracks as MP3 files
- **Favorites System**: Mark and filter favorite generations

### 📊 History & Management
- **Generation History**: Keep track of all your generated music
- **Favorites Filter**: View only your favorite tracks
- **Batch Operations**: Clear history, export data
- **Session Persistence**: Automatically save state between sessions

## Installation

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Install OGL Dependency**
   ```bash
   npm install ogl
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

The application will open at `http://localhost:3000`.

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── AudioPlayer.tsx          # Custom audio player
│   │   ├── ContextTags.tsx          # Situational tags selector
│   │   ├── ExamplePrompts.tsx       # Curated example prompts
│   │   ├── Galaxy.tsx               # WebGL galaxy background
│   │   ├── Header.tsx               # App header with branding
│   │   ├── InputSection.tsx         # Main input area
│   │   ├── MainContent.tsx          # Main content wrapper
│   │   ├── MoodSelector.tsx         # Mood selection component
│   │   ├── OutputSection.tsx        # Generated music display
│   │   ├── Sidebar.tsx              # Settings and history sidebar
│   │   └── WaveformVisualization.tsx # Audio waveform display
│   ├── types.ts                     # TypeScript type definitions
│   ├── App.tsx                      # Main app component
│   ├── index.tsx                    # React entry point
│   └── index.css                    # Global styles with Tailwind
├── package.json
├── tailwind.config.js               # Tailwind CSS configuration
└── postcss.config.js               # PostCSS configuration
```

## Key Components

### Galaxy Background
- Interactive WebGL animation using OGL library
- Mouse interaction with repulsion effects
- Customizable colors, density, and animation speed
- Transparent overlay support for glassmorphism

### Audio Player
- Custom-built HTML5 audio player
- Seek functionality with visual progress
- Volume control with mute toggle
- Skip forward/backward (10 seconds)
- Time display and duration tracking

### Waveform Visualization
- Real-time audio analysis and visualization
- Canvas-based rendering with gradient effects
- Responsive design with device pixel ratio support
- Error handling for audio processing

### Settings Management
- Persistent settings using localStorage
- Real-time parameter updates
- Advanced settings panel (collapsible)
- Expert mode toggle for advanced users

## Styling

The application uses Tailwind CSS with custom glassmorphism utilities:

- `.glass` - Standard glass effect with backdrop blur
- `.glass-dark` - Darker glass variant
- `.glass-button` - Interactive glass buttons
- `.glass-input` - Glass-styled form inputs

## API Integration

The frontend expects a backend API at `/api/generate` with the following interface:

```typescript
// Request
POST /api/generate
{
  prompt: string;
  mood: string;
  tags: string[];
  settings: GenerationSettings;
}

// Response
{
  audioUrl: string;
  enhancedPrompt: string;
  generationTime: number;
}
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

WebGL support is required for the galaxy background animation.

## Performance

- Optimized React rendering with proper state management
- Efficient WebGL animations with requestAnimationFrame
- Lazy loading of audio waveforms
- Debounced user interactions

## Customization

### Galaxy Background
Modify galaxy properties in `App.tsx`:
```typescript
<Galaxy
  density={1.2}
  glowIntensity={0.4}
  saturation={0.6}
  hueShift={220}
  mouseRepulsion={true}
/>
```

### Color Scheme
Update Tailwind configuration in `tailwind.config.js` to change the color palette.

### Example Prompts
Add new example prompts in `components/ExamplePrompts.tsx` by extending the `allExamples` array.

## Development

### Available Scripts
- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run test suite
- `npm eject` - Eject from Create React App

### Code Style
- TypeScript for type safety
- Functional components with hooks
- Consistent naming conventions
- Comprehensive error handling

## Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy the `build` folder** to your web server or hosting platform

3. **Configure backend API** endpoint if different from `/api/generate`

## Troubleshooting

### Galaxy Background Not Loading
- Ensure WebGL is supported and enabled in the browser
- Check browser console for WebGL context errors
- Verify OGL library is properly installed

### Audio Player Issues
- Ensure audio files are served with proper CORS headers
- Check that the audio format is supported (MP3 recommended)
- Verify audio URLs are accessible

### Build Errors
- Clear node_modules and reinstall dependencies
- Ensure all peer dependencies are satisfied
- Check TypeScript configuration for any type errors