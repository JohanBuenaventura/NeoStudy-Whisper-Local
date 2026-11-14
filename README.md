# NeoStudy Whisper Local

A local speech-to-text browser extension that captures tab audio and transcribes spoken content using [Faster-Whisper](https://github.com/SYSTRAN/faster-whisper).

Designed for NeoStudy lesson videos, the extension can also adjust video playback speed and display the generated transcript.

**No cloud transcription API is required.** Audio is processed locally on your computer.

## Features

- **Video speed control** — Adjust supported video playback speeds, including 2×.
- **Tab audio capture** — Capture audio playing inside the browser tab.
- **Local speech recognition** — Transcribe audio using Faster-Whisper.
- **Transcript display** — View and retrieve recognized speech.
- **Copy and download** — Save the generated transcript.
- **Local processing** — Audio is sent to a local Python server running on `127.0.0.1:8765`.

## Technologies

- JavaScript
- Chrome Extension Manifest V3
- HTML and CSS
- Python
- Flask
- Faster-Whisper
- PyAV

## Requirements

- Windows 10 or Windows 11
- Brave Browser or Google Chrome
- Python installed
- Internet connection for initial Python package installation and Whisper model download

## Project Structure

```text
NeoStudy-Whisper-Local/
│
├── manifest.json
├── background.js
├── content.js
├── offscreen.html
├── offscreen.js
│
├── server.py
├── requirements.txt
├── start-whisper.bat
│
├── README.md
│
├── .venv/                 # Generated locally
└── debug_audio/           # Optional diagnostic recordings
```

## Installation

### 1. Download the repository

Clone the repository:

```powershell
git clone YOUR_GITHUB_REPOSITORY_URL
```

Alternatively, download the repository as a ZIP file from GitHub and extract it.

### 2. Install the browser extension

For Brave:

1. Open `brave://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the project folder containing `manifest.json`.
5. Confirm that NeoStudy Whisper Local appears in your extensions list.

For Google Chrome, use:

```text
chrome://extensions
```

Follow the same steps.

**Important:** Select the actual extension folder containing `manifest.json`, not a parent folder that does not contain it.

### 3. Install and start the local Whisper server

Open the extracted project folder.

Run:

```text
start-whisper.bat
```

The startup script should create the Python virtual environment, install the required packages, and start the local Flask server.

The default server address is:

```text
http://127.0.0.1:8765
```

### 4. Verify the server

Open this address in your browser:

```text
http://127.0.0.1:8765/health
```

A successful response should indicate that the server is ready and show the configured Whisper model.

### 5. Start using the extension

1. Open NeoStudy.
2. Start the lesson video.
3. Use the extension to start audio capture.
4. Allow the extension to capture tab audio.
5. Play the lesson.
6. View the generated transcript in the extension panel.
7. Stop capturing when finished.

## Whisper Configuration

The server uses these defaults:

| Setting | Default |
|---|---|
| Model | `base` |
| Device | `cpu` |
| Compute type | `int8` |
| Server host | `127.0.0.1` |
| Server port | `8765` |

The model can be configured using environment variables:

```powershell
$env:WHISPER_MODEL = "base"
$env:WHISPER_DEVICE = "cpu"
$env:WHISPER_COMPUTE_TYPE = "int8"
```

Available model sizes include `tiny`, `base`, `small`, `medium`, and `large-v3`. Larger models generally require more processing power and memory.

## API Endpoints

The local Flask server provides:

| Endpoint | Method | Purpose |
|---|---|---|
| `/health` | GET | Check server status |
| `/transcript` | GET | Retrieve accumulated transcript |
| `/transcribe` | POST | Submit audio for transcription |

## Troubleshooting

### Cannot connect to the local server

Make sure `start-whisper.bat` is running.

Verify:

```powershell
Invoke-RestMethod http://127.0.0.1:8765/health
```

### InvalidDataError when transcribing

Faster-Whisper may report:

```text
av.error.InvalidDataError:
Invalid data found when processing input
```

This can happen when an uploaded WebM recording is incomplete, corrupted, or not independently decodable.

The recording and segment-upload process should be checked if this error occurs repeatedly.

### Extension does not appear

- Verify that Developer mode is enabled.
- Select the directory containing `manifest.json`.
- Check that the extension files are present.
- Reload the extension after making changes.

## Privacy

- Audio is processed by the local Whisper server.
- The server binds to `127.0.0.1`, making it accessible through the local computer rather than being intentionally exposed to the network.
- No external transcription API is configured by default.
- Initial model and dependency downloads require an internet connection.

## Current Limitations

- Transcription is processed in audio segments rather than word-by-word.
- Recognition accuracy depends on audio quality, background noise, and the selected Whisper model.
- Browser tab audio capture must be supported by the browser and the page's audio playback method.
- Intermittent invalid WebM segments are a known issue under investigation.

## License

Choose and add a license before distributing this project publicly. If you intend to accept contributions or allow reuse, consider adding an appropriate open-source license.