NeoStudy Helper - Local Whisper (Windows / Brave / Chrome)
==========================================================

WHAT IT DOES
- Sets HTML5 lesson videos to 2x by default (change in the floating panel).
- Captures audio from the active browser tab after you click the extension toolbar icon.
- Sends short audio chunks ONLY to your own local server at 127.0.0.1:8765.
- Transcribes with faster-whisper locally; no Web Speech Recognition network service.
- Shows accumulated transcript in the page panel and supports copy / TXT download.

REQUIREMENTS
- Windows 10/11
- Python 3.10-3.12 recommended
- Brave or Chrome
- Internet is needed the first time to install Python packages and download the Whisper model.
  Transcription after setup is local.

INSTALL LOCAL TRANSCRIPTION SERVER
1. Extract this folder to a permanent location.
2. Double-click start-whisper.bat.
3. First run installs packages and downloads the "base" Whisper model (may take a while).
4. Wait until the terminal says "Whisper ready."
5. Keep the terminal open while transcribing.

INSTALL BROWSER EXTENSION
1. Open brave://extensions (or chrome://extensions).
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this folder (the one containing manifest.json).
5. Open/reload NeoStudy.

USE
1. Start the local server first.
2. Open the NeoStudy lesson tab.
3. Click the NeoStudy Helper extension icon in the browser toolbar ONCE to start capture.
4. Play the lesson. Audio should remain audible while it is captured.
5. The transcript appears in the floating panel.
6. Click the extension icon again to stop capture.
7. Use Copy transcript or Download transcript.

TROUBLESHOOTING
- "Local Whisper offline": start start-whisper.bat and wait for "Whisper ready".
- Extension says ERR: inspect brave://extensions -> NeoStudy Helper -> Errors.
- No audio captured: ensure the lesson tab is active when clicking the extension icon; start capture after the page has loaded.
- If video audio is muted or the tab is silent, the capture will also be silent.
- First run can be slow. "base" model is a reasonable starting point for a laptop CPU.
- If the transcript is slow, use WHISPER_MODEL=tiny in the same terminal before starting server.py.
- To try GPU later, install a compatible CUDA-enabled CTranslate2 setup; default CPU int8 is the safer first setup.

PRIVACY
- Audio is sent from the browser to 127.0.0.1 only and processed locally.
- The server binds to localhost, not your LAN.
- Do not expose port 8765 to the internet.
- Respect your school's rules and any applicable restrictions on recording lesson audio.

LIMITATIONS
- This is chunk-based transcription, not word-by-word live captions. Text appears after each ~8-second audio chunk is processed.
- Short chunk boundaries can occasionally cut words; Whisper may omit or repeat a few words.
- The extension captures the selected tab's audio, not microphone input.
