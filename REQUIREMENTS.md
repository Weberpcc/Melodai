# GUIDELINE.md

## MelodAI Project Setup & Git Troubleshooting Guide

This document explains the **environment requirements**, **common errors**, and **solutions** encountered while setting up and pushing the MelodAI project to GitHub. It also includes **device compatibility**, **alternative tools**, and **checks to verify if dependencies are already installed**.

---

# 1. Supported Device & System Requirements

## Recommended Hardware

| Component      | Recommended                                           |
| -------------- | ----------------------------------------------------- |
| Processor      | Intel i5 / i7 or AMD Ryzen 5 / Ryzen 7                |
| RAM            | Minimum 8 GB (16 GB recommended for AI libraries)     |
| Storage        | 10–20 GB free space                                   |
| GPU (Optional) | NVIDIA GPU with CUDA support for faster AI processing |

## Tested Device Example

* **Processor:** AMD Ryzen 7 5700U
* **RAM:** 16 GB
* **OS:** Windows 10/11 (64-bit)

This configuration works well for:

* Python AI libraries
* Audio processing
* React frontend
* Flask backend

---

# 2. Required Software Versions

## Core Tools

| Tool    | Recommended Version |
| ------- | ------------------- |
| Python  | 3.9 – 3.11          |
| Node.js | 18+                 |
| Git     | Latest              |
| VS Code | Latest              |
| FFmpeg  | Latest stable       |

---

# 3. Python Libraries Used

Example dependencies:

```
torch==2.1.0
torchaudio==2.1.0
transformers
streamlit
openai
music21
mido
flask
flask-cors
flask-socketio
pretty_midi
pydub
scipy
soundfile
python-dotenv
numpy<2.0.0
accelerate
ffmpeg-python
```

Install using:

```
pip install -r requirements.txt
```

---

# 4. Checking If Software Is Already Installed

## Python

```
python --version
```

Expected output example:

```
Python 3.10.6
```

---

## Node.js

```
node -v
```

---

## Git

```
git --version
```

---

## FFmpeg

```
ffmpeg -version
```

If the command fails, FFmpeg is not installed.

---

# 5. Installing Missing Tools

## Python

Download from:

https://www.python.org/downloads/

---

## Node.js

Download from:

https://nodejs.org

---

## FFmpeg (Windows)

1. Download from
   https://ffmpeg.org/download.html

2. Extract

3. Add to **System PATH**

---

# 6. GitHub Push Issues & Solutions

## Problem 1

### `rm -rf .git` not working in PowerShell

Linux command was used in Windows PowerShell.

### Solution

```
Remove-Item -Recurse -Force .git
```

---

## Problem 2

### Uploading 100k+ files

Cause:

Large directories committed such as:

```
node_modules
venv
audiocraft
generated_music
```

### Solution

Create `.gitignore`

```
node_modules/
venv/
__pycache__/
generated_music/
.env
```

Then reset git.

---

## Problem 3

### `src refspec main does not match any`

Cause:

Branch name mismatch.

### Solution

Rename branch:

```
git branch -M main
```

---

## Problem 4

### Remote contains work you do not have locally

GitHub already had commits.

### Solution

Force push:

```
git push -u origin main --force
```

---

## Problem 5

### Repository moved warning

Old URL used.

### Solution

Update remote:

```
git remote set-url origin https://github.com/Weberpcc/Melodai.git
```

---

# 7. Standard Git Workflow

After initial setup, use:

```
git add .
git commit -m "update"
git push
```

---

# 8. Recommended `.gitignore` for AI Projects

```
venv/
node_modules/
__pycache__/
*.pt
*.pth
*.ckpt
*.bin
*.wav
generated_music/
.env
```

This prevents uploading:

* AI model files
* virtual environments
* audio outputs
* node modules

---

# 9. Alternative Tools (If Setup Fails)

| Task               | Alternative |
| ------------------ | ----------- |
| Python environment | Conda       |
| Backend framework  | FastAPI     |
| Audio processing   | Librosa     |
| AI model hosting   | HuggingFace |
| Deployment         | Docker      |

---

# 10. Project Structure Recommendation

```
Melodai
│
├── backend
│   ├── app.py
│   ├── models
│   └── services
│
├── frontend
│   ├── src
│   └── public
│
├── generated_music
│
├── requirements.txt
├── package.json
├── .gitignore
└── GUIDELINE.md
```

---

# 11. Quick Troubleshooting Checklist

If something fails, check:

1. Python version
2. Node.js installed
3. FFmpeg installed
4. Virtual environment activated
5. `.gitignore` configured
6. Git remote correct

---

# 12. Conclusion

This guide ensures that the MelodAI project can be set up and run correctly across supported devices. It also documents the issues encountered during Git configuration and provides reliable solutions and alternatives.
