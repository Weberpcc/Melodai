# MelodAI - New Features Usage Guide

## 🎨 Feature 1: Variation Generator

### What it does
Generates multiple versions of the same prompt with different parameters to give you creative options.

### How to use
1. Generate your initial music track
2. In the output section, click **"Show Variations"** button
3. Select how many variations you want (2-5)
4. Click **"Generate X Variations"**
5. Wait for all variations to generate
6. Listen to each variation side-by-side
7. Click the 👍 thumbs up icon to vote for your favorites

### What you'll see
- Grid of variation cards
- Each card shows:
  - Variation number
  - Audio player
  - Parameter values (Temperature, CFG)
  - Vote button
- Highlighted border for voted variations
- Summary of your votes at the bottom

---

## ⏱️ Feature 2: Music Extender

### What it does
Takes your 30-second track and extends it to 60, 90, or even 120 seconds while maintaining musical coherence.

### How to use
1. Generate your initial music track
2. In the output section, click **"Show Extender"** button
3. Use the slider to choose target duration (e.g., 60s)
4. Click **"Extend to 60s"**
5. Wait for the extension to generate
6. Listen to the extended version

### What you'll see
- Current duration display
- Target duration slider (10s increments)
- Extend button with target duration
- Success message with final duration
- Audio player for extended version

### Technical note
- Uses 2-second crossfade for smooth transitions
- Maintains the same musical style and prompt

---

## ⚙️ Feature 3: Advanced Parameters

### What it does
Gives you expert-level control over the AI generation parameters.

### How to use
1. Click **"Advanced Parameters"** toggle button (below input section)
2. Enable **"Expert Mode"** checkbox
3. Adjust the sliders:
   - **Temperature**: 0.5 (conservative) to 2.0 (experimental)
   - **CFG Scale**: 1.0 (creative) to 10.0 (strict adherence)
   - **Top-K**: 50 (focused) to 500 (diverse)
   - **Top-P**: 0.0 (disabled) to 1.0 (max diversity)
4. Hover over ℹ️ icons for parameter explanations
5. Generate music with your custom settings

### Parameter Guide

**Temperature (Creativity)**
- Lower (0.5-0.8): More predictable, safer choices
- Higher (1.2-2.0): More experimental, surprising results

**CFG Scale**
- Lower (1-3): AI has more creative freedom
- Higher (5-10): AI follows your prompt more strictly

**Top-K**
- Lower (50-150): More focused, coherent output
- Higher (250-500): More diverse, varied output

**Top-P (Nucleus Sampling)**
- 0.0: Disabled (uses Top-K only)
- 0.9: Balanced diversity
- 0.95-1.0: Maximum diversity

---

## 📦 Feature 4: Batch Generation

### What it does
Generate music for multiple prompts at once, saving you time.

### How to use
1. Click **"Batch Generation"** toggle button
2. Enter your prompts in the textarea (one per line)
3. You can enter up to 10 prompts
4. Click **"Generate All (X)"** where X is the number of prompts
5. Wait for all generations to complete
6. Review results in the grid

### What you'll see
- Success/failure count at the top
- Total generation time
- Grid of results with:
  - Green border: Successful generation
  - Red border: Failed generation
  - Audio player for successful ones
  - Error message for failed ones
- **"Download All"** button to save all successful tracks

### Example prompts
```
A relaxing piano melody with soft strings
Upbeat electronic dance music with energetic beats
Sad violin solo with emotional depth
Groovy funk bass with tight drums
Ambient space music with ethereal pads
```

### Tips
- Keep prompts descriptive (10+ characters)
- Each prompt generates independently
- Failed prompts don't stop the batch
- Download all at once when complete

---

## 🎯 Workflow Examples

### Workflow 1: Find the Perfect Variation
1. Generate initial track: "Upbeat electronic music"
2. Click "Show Variations"
3. Generate 5 variations
4. Listen to all 5
5. Vote for your top 2 favorites
6. Download the best one

### Workflow 2: Create Extended Mix
1. Generate 30s track
2. Click "Show Extender"
3. Extend to 90s
4. Download extended version
5. Use for longer content

### Workflow 3: Batch Production
1. Prepare 10 different prompts
2. Open Batch Generator
3. Paste all prompts
4. Generate all at once
5. Download all successful tracks
6. Use for music library

### Workflow 4: Fine-tune with Advanced Parameters
1. Enable Advanced Parameters
2. Turn on Expert Mode
3. Set Temperature to 1.5 (more creative)
4. Set CFG Scale to 5.0 (balanced)
5. Generate with custom settings
6. Compare with default settings

---

## 💡 Pro Tips

### For Variations
- Generate 3-5 variations to get good variety
- Vote as you listen to track preferences
- Parameters show what makes each unique
- Use variations to find your preferred style

### For Extensions
- Start with 30s, extend to 60s for most use cases
- Extensions maintain the original style
- Great for background music that needs to loop
- Crossfade ensures smooth transitions

### For Advanced Parameters
- Start with defaults, then experiment
- Higher temperature = more surprises
- Higher CFG = closer to your prompt
- Top-K and Top-P work together
- Save settings that work well for you

### For Batch Generation
- Write clear, descriptive prompts
- Test one prompt first, then batch similar ones
- Use for creating music libraries
- Download all at once to save time
- Review failed ones to improve prompts

---

## 🚀 Getting Started

1. **Start Backend**
   ```bash
   python backend/start_server.py
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm start
   ```

3. **Access App**
   - Open browser to `http://localhost:3000`
   - Backend runs on `http://localhost:5000`

4. **Try Features**
   - Generate initial music
   - Explore new buttons and toggles
   - Experiment with parameters
   - Have fun creating!

---

## 🐛 Troubleshooting

**Variations not generating?**
- Check backend console for errors
- Ensure original prompt is valid
- Try with fewer variations first

**Extension fails?**
- Verify original file exists
- Check target duration > current duration
- Ensure backend has enough memory

**Batch generation slow?**
- Normal for multiple generations
- Each track takes 20-40 seconds
- Consider reducing batch size

**Advanced parameters not showing?**
- Click "Advanced Parameters" toggle
- Enable "Expert Mode" checkbox
- Refresh page if needed

---

## 📊 Performance Notes

- **Single Generation**: ~20-40 seconds
- **3 Variations**: ~60-120 seconds
- **Extension (30s→60s)**: ~30-50 seconds
- **Batch (5 prompts)**: ~100-200 seconds

Times vary based on:
- Hardware (GPU vs CPU)
- Model size
- Duration settings
- System load

---

Enjoy creating amazing music with MelodAI! 🎵✨
