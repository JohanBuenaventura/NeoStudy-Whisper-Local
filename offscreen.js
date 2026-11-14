
let mediaRecorder = null;
let audioStream = null;
let audioContext = null;
let audioSource = null;

let chunkNumber = 0;
let uploadQueue = Promise.resolve();
let segmentTimer = null;
let isCapturing = false;
let currentStopPromise = null;

const SEGMENT_DURATION_MS = 10000;

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.target !== "offscreen") return;

  if (msg.type === "START_CAPTURE") {
    startCapture(msg.streamId);
  }

  if (msg.type === "STOP_CAPTURE") {
    stopCapture();
  }
});

function getRecorderOptions() {
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return { mimeType: "audio/webm;codecs=opus" };
  }

  if (MediaRecorder.isTypeSupported("audio/webm")) {
    return { mimeType: "audio/webm" };
  }

  return {};
}

async function startCapture(streamId) {
  try {
    if (isCapturing) return;

    audioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId
        }
      },
      video: false
    });

    audioContext = new AudioContext();
    await audioContext.resume();

    audioSource = audioContext.createMediaStreamSource(audioStream);
    audioSource.connect(audioContext.destination);

    chunkNumber = 0;
    isCapturing = true;

    startRecordingSegment();
  } catch (error) {
    console.error("Audio capture failed:", error);
    await cleanupCapture();
    chrome.runtime.sendMessage({ type: "CAPTURE_STOPPED" });
  }
}

function startRecordingSegment() {
  if (!isCapturing || !audioStream) return;

  try {
    const recorder = new MediaRecorder(audioStream, getRecorderOptions());
    const chunks = [];

    mediaRecorder = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onerror = (event) => {
      console.error("MediaRecorder error:", event.error || event);
    };

    recorder.onstop = () => {
      const number = ++chunkNumber;
      const blob = new Blob(chunks, {
        type: recorder.mimeType || "audio/webm"
      });

      if (blob.size > 0) {
        uploadQueue = uploadQueue
          .then(() => uploadChunk(blob, number))
          .catch((error) => {
            console.error("Upload queue error:", error);
          });
      }

      if (mediaRecorder === recorder) {
        mediaRecorder = null;
      }

      if (isCapturing) {
        startRecordingSegment();
      }
    };

    recorder.start();

    segmentTimer = setTimeout(() => {
      if (isCapturing && recorder.state === "recording") {
        recorder.stop();
      }
    }, SEGMENT_DURATION_MS);

  } catch (error) {
    console.error("Could not start recording segment:", error);
    stopCapture();
  }
}

async function uploadChunk(blob, number) {
  const form = new FormData();

  form.append("audio", blob, `segment-${number}.webm`);
  form.append("chunk", String(number));

  try {
    const response = await fetch(
      "http://127.0.0.1:8765/transcribe",
      {
        method: "POST",
        body: form
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.error || `Local server returned ${response.status}`
      );
    }

    if (result.text) {
      console.log(`Transcribed segment ${number}:`, result.text);
    }
  } catch (error) {
    console.error(`Whisper upload failed for segment ${number}:`, error);
  }
}

async function stopCapture() {
  if (!isCapturing && !mediaRecorder) return;

  isCapturing = false;

  if (segmentTimer) {
    clearTimeout(segmentTimer);
    segmentTimer = null;
  }

  const recorder = mediaRecorder;

  if (recorder && recorder.state !== "inactive") {
    const stopped = new Promise((resolve) => {
      recorder.addEventListener("stop", resolve, { once: true });
    });

    recorder.stop();
    await stopped;
  }

  await uploadQueue;
  await cleanupCapture();

  chrome.runtime.sendMessage({ type: "CAPTURE_STOPPED" });
}

async function cleanupCapture() {
  isCapturing = false;

  if (segmentTimer) {
    clearTimeout(segmentTimer);
    segmentTimer = null;
  }

  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    try {
      mediaRecorder.stop();
    } catch (error) {
      console.warn("Recorder cleanup:", error);
    }
  }

  mediaRecorder = null;

  if (audioSource) {
    try {
      audioSource.disconnect();
    } catch {}
    audioSource = null;
  }

  if (audioStream) {
    audioStream.getTracks().forEach((track) => track.stop());
    audioStream = null;
  }

  if (audioContext) {
    await audioContext.close().catch(() => {});
    audioContext = null;
  }
}
