# MelodAI - Quick Reference Card

## 🚀 Quick Start

```bash
# Terminal 1 - Backend
python backend/start_server.py

# Terminal 2 - Frontend
cd frontend && npm start

# Open browser
http://localhost:3000
```

---

## 🎨 New Features Cheat Sheet

### 1️⃣ Variation Generator
**Location**: Output section → "Show Variations" button

```
1. Generate music
2. Click "Show Variations"
3. Select count (2-5)
4. Click "Generate X Variations"
5. Vote with 👍
```

**Use Case**: Find the perfect version of your track

---

### 2️⃣ Music Extender
**Location**: Output section → "Show Extender" button

```
1. Generate music (e.g., 30s)
2. Click "Show Extender"
3. Slide to target (e.g., 60s)
4. Click "Extend to 60s"
5. Listen to extended version
```

**Use Case**: Make longer versions for videos/podcasts

---

### 3️⃣ Advanced Parameters
**Location**: Below input section → "Advanced Parameters" toggle

```
1. Click "Advanced Parameters"
2. Enable "Expert Mode"
3. Adjust sliders:
   - Temperature: 0.5-2.0
   - CFG Scale: 1.0-10.0
   - Top-K: 50-500
   - Top-P: 0.0-1.0
4. Generate with custom settings
```

**Use Case**: Fine-tune generation behavior

---

### 4️⃣ Batch Generation
**Location**: Below input section → "Batch Generation" toggle

```
1. Click "Batch Generation"
2. Enter prompts (one per line)
3. Click "Generate All (X)"
4. Wait for completion
5. Click "Download All"
```

**Use Case**: Create music library quickly

---

## 🎛️ Parameter Guide

| Parameter | Range | Low Value | High Value |
|-----------|-------|-----------|------------|
| **Temperature** | 0.5-2.0 | Conservative | Experimental |
| **CFG Scale** | 1.0-10.0 | Creative | Strict |
| **Top-K** | 50-500 | Focused | Diverse |
| **Top-P** | 0.0-1.0 | Disabled | Max Diversity |

---

## 📋 API Endpoints

### Generate Variations
```http
POST /api/generate-variations
Content-Type: application/json

{
  "prompt": "upbeat music",
  "mood": "happy",
  "tags": ["workout"],
  "settings": {...},
  "numVariations": 3
}
```

### Extend Music
```http
POST /api/extend-music
Content-Type: application/json

{
  "audioFilename": "gen_123456.mp3",
  "prompt": "upbeat music",
  "targetDuration": 60,
  "settings": {...}
}
```

### Batch Generate
```http
POST /api/batch-generate
Content-Type: application/json

{
  "prompts": [
    {"prompt": "calm piano"},
    {"prompt": "energetic drums"}
  ],
  "settings": {...}
}
```

---

## 🎯 Common Workflows

### Workflow 1: Perfect Track
```
Generate → Variations (5) → Vote → Download Best
```

### Workflow 2: Extended Mix
```
Generate (30s) → Extend (90s) → Download
```

### Workflow 3: Music Library
```
Batch (10 prompts) → Review → Download All
```

### Workflow 4: Fine-Tuned
```
Advanced Params → Adjust → Generate → Compare
```

---

## ⚡ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Focus prompt | `Tab` |
| Generate | `Enter` (in prompt) |
| Toggle sidebar | `Ctrl/Cmd + B` |
| Download | `Ctrl/Cmd + S` |

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend not starting | Check Python environment, install requirements |
| Frontend not connecting | Verify backend is running on port 5000 |
| Slow generation | Normal on CPU, use GPU for faster results |
| Variations fail | Check backend logs, reduce variation count |
| Extension fails | Ensure original file exists in generated_music/ |
| Batch timeout | Reduce batch size, check system resources |

---

## 📊 Performance Tips

- **GPU**: 20-30s per track
- **CPU**: 40-60s per track
- **Variations**: ~3x single generation time
- **Extension**: ~1x original duration time
- **Batch**: Linear scaling (5 tracks = 5x time)

---

## 🎵 Best Practices

### Prompts
- ✅ Be specific: "upbeat electronic dance music with energetic beats"
- ❌ Too vague: "music"
- ✅ Include details: tempo, instruments, mood
- ❌ Too long: Keep under 500 characters

### Variations
- Start with 3 variations
- Vote as you listen
- Use for A/B testing
- Compare parameter differences

### Extensions
- Test with 30s → 60s first
- Check crossfade quality
- Use for background music
- Consider memory limits

### Batch
- Test one prompt first
- Group similar styles
- Max 10 per batch
- Review before downloading

### Parameters
- Start with defaults
- Change one at a time
- Note what works
- Save successful combinations

---

## 📁 File Locations

```
Backend:
- Server: backend/server.py
- Variations: backend/music_variations.py
- Output: generated_music/

Frontend:
- Components: frontend/src/components/
- Types: frontend/src/types.ts
- App: frontend/src/App.tsx

Documentation:
- Features: FEATURES_ADDED.md
- Usage: USAGE_GUIDE.md
- Summary: IMPLEMENTATION_SUMMARY.md
- This file: QUICK_REFERENCE.md
```

---

## 🔗 Useful Links

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`
- Health Check: `http://localhost:5000/api/health`
- Models: `http://localhost:5000/api/models`

---

## 💾 Save & Export

### Single Track
```
Output Section → Download Button → Save as MP3
```

### Batch Results
```
Batch Generator → Download All → Saves all successful tracks
```

### Variations
```
Each variation has individual download button
```

---

## 🎓 Learning Path

1. **Beginner**: Use default settings, try examples
2. **Intermediate**: Experiment with moods and tags
3. **Advanced**: Enable expert mode, adjust parameters
4. **Expert**: Use variations, batch, and extensions

---

## ⚙️ Default Settings

```typescript
duration: 30s
creativity: 1.0 (temperature)
model: musicgen-medium
topK: 250
topP: 0.0
cfgScale: 3.0
expertMode: false
```

---

## 🎨 UI Elements

| Element | Location | Purpose |
|---------|----------|---------|
| Prompt Input | Top | Describe music |
| Mood Selector | Right | Set emotional tone |
| Context Tags | Right | Add use case tags |
| Generate Button | Center | Start generation |
| Advanced Toggle | Below input | Show parameters |
| Batch Toggle | Below input | Show batch mode |
| Show Variations | Output section | Generate variations |
| Show Extender | Output section | Extend duration |

---

## 📱 Responsive Design

- **Desktop**: Full layout with sidebar
- **Tablet**: Collapsible sidebar
- **Mobile**: Stacked layout, touch-friendly

---

## 🔐 Security Notes

- Backend runs on localhost only
- No authentication required (local use)
- Files saved to local directory
- No external API calls (except model download)

---

## 🎉 Pro Tips

1. **Save Time**: Use batch for multiple tracks
2. **Find Best**: Generate 5 variations, vote
3. **Longer Tracks**: Extend instead of regenerating
4. **Experiment**: Try different parameter combinations
5. **Organize**: Name downloads descriptively
6. **Learn**: Read tooltips in advanced mode
7. **Iterate**: Use variations to refine style
8. **Plan**: Write prompts in batch mode first

---

**Last Updated**: December 2024
**Version**: 2.0 (with advanced features)

🎵 Happy Creating! ✨
