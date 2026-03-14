# backend/music_config.py

# --- Configuration for Task 1.5: 15 Test Generations ---
TEST_GENERATIONS = [
    # 1. Pop/Happy - High Creativity (Temp=1.1, High Guidance=5.0)
    {'prompt': "upbeat happy pop music, major key, synth and bright drums", 'duration': 15, 'temperature': 1.1, 'cfg_coef': 5.0},
    # 2. Sad/Mellow - Low Creativity (Temp=0.8, Standard Guidance)
    {'prompt': "sad slow piano melody, minor key, reflective, light reverb", 'duration': 30, 'temperature': 0.8, 'cfg_coef': 3.0},
    # 3. EDM/Energy - High Energy/High Guidance (Temp=1.2, Very High Guidance=6.0)
    {'prompt': "energetic electronic dance music, driving beat, powerful bassline", 'duration': 15, 'temperature': 1.2, 'cfg_coef': 6.0},
    # 4. Ambient/Calm - Very Low Creativity (Temp=0.5, Low Guidance=2.0, Longest Duration)
    {'prompt': "calm peaceful ambient sounds, smooth pads, no rhythm", 'duration': 60, 'temperature': 0.5, 'cfg_coef': 2.0},
    # 5. Acoustic/Romantic - Standard Settings
    {'prompt': "romantic acoustic guitar, soft fingerpicking, gentle percussion", 'duration': 25, 'temperature': 1.0, 'cfg_coef': 3.5},
    # 6. Orchestral/Intense - High Guidance for adherence
    {'prompt': "intense dramatic orchestral, loud brass, fast strings", 'duration': 20, 'temperature': 1.0, 'cfg_coef': 7.0},
    # 7. Funk/Groovy - High Creativity
    {'prompt': "groovy funk bass, tight drums, wah guitar, medium tempo", 'duration': 30, 'temperature': 1.1, 'cfg_coef': 4.0},
    # 8. Dark/Atmospheric - Low Creativity (More stable result)
    {'prompt': "mysterious dark atmospheric, slow synth drone, unsettling mood", 'duration': 40, 'temperature': 0.7, 'cfg_coef': 3.0},
    # 9. Lo-fi/Hip Hop - Standard
    {'prompt': "lo-fi hip hop beat, dusty vinyl crackle, rhodes piano", 'duration': 30, 'temperature': 1.0, 'cfg_coef': 3.0},
    # 10. Heavy Metal - High Creativity/High Guidance
    {'prompt': "heavy metal riff, distorted guitar, double bass drum", 'duration': 15, 'temperature': 1.3, 'cfg_coef': 5.0},
    # 11. Chiptune/8-bit - High Creativity
    {'prompt': "8-bit chiptune background music, fast paced, arcade sound", 'duration': 20, 'temperature': 1.1, 'cfg_coef': 4.5},
    # 12. Smooth Jazz - Low Creativity
    {'prompt': "smooth jazz saxophone solo, relaxed beat, walking bass", 'duration': 45, 'temperature': 0.9, 'cfg_coef': 2.5},
    # 13. Cartoon/Whimsical - Short Duration, High Creativity
    {'prompt': "children's cartoon music, whimsical, bouncy rhythm", 'duration': 10, 'temperature': 1.2, 'cfg_coef': 5.0},
    # 14. Epic Trailer - Highest Guidance (Critical for specific structure)
    {'prompt': "epic movie trailer score, crescendo and large percussion hits", 'duration': 30, 'temperature': 1.0, 'cfg_coef': 7.5},
    # 15. Minimal Techno - Lowest Temperature (Repetitive structure needed)
    {'prompt': "minimal techno loop, repetitive kick drum, subtle filter sweep", 'duration': 30, 'temperature': 0.6, 'cfg_coef': 2.0},
]