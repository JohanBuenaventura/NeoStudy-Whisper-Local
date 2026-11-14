
from flask import Flask, request, jsonify
from faster_whisper import WhisperModel
from pathlib import Path
import tempfile
import os
import threading

app = Flask(__name__)

MODEL_NAME = os.environ.get("WHISPER_MODEL", "base")
DEVICE = os.environ.get("WHISPER_DEVICE", "cpu")
COMPUTE = os.environ.get("WHISPER_COMPUTE_TYPE", "int8")

print(
    f"Loading Whisper model={MODEL_NAME}, "
    f"device={DEVICE}, compute={COMPUTE}..."
)

model = WhisperModel(
    MODEL_NAME,
    device=DEVICE,
    compute_type=COMPUTE
)

print("Whisper ready.")

transcript_parts = []
transcript_lock = threading.Lock()

# Prevent simultaneous requests from using the model at the same time.
model_lock = threading.Lock()


@app.after_request
def cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


@app.route("/health")
def health():
    return jsonify(
        ready=True,
        model=MODEL_NAME,
        device=DEVICE,
        compute_type=COMPUTE
    )


@app.route("/transcript")
def transcript():
    with transcript_lock:
        return jsonify(text="\n".join(transcript_parts))


@app.route("/transcribe", methods=["POST", "OPTIONS"])
def transcribe():
    if request.method == "OPTIONS":
        return ("", 204)

    uploaded = request.files.get("audio")

    if not uploaded:
        return jsonify(error="No audio file was uploaded."), 400

    suffix = Path(uploaded.filename or "segment.webm").suffix or ".webm"
    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as tmp:
            uploaded.save(tmp.name)
            temp_path = tmp.name

        if os.path.getsize(temp_path) == 0:
            return jsonify(error="The uploaded audio file is empty."), 400

        with model_lock:
            segments, info = model.transcribe(
                temp_path,
                beam_size=1,
                vad_filter=True,
                condition_on_previous_text=False
            )

            text = " ".join(
                segment.text.strip()
                for segment in segments
            ).strip()

        if text:
            with transcript_lock:
                transcript_parts.append(text)

        return jsonify(
            text=text,
            language=info.language
        )

    except Exception as exc:
        app.logger.exception("Transcription failed")

        error_message = str(exc)

        if "Invalid data found" in error_message:
            return jsonify(
                error="Whisper could not decode this audio segment. "
                      "It may be incomplete or corrupted.",
                details=error_message
            ), 422

        return jsonify(
            error="Transcription failed.",
            details=error_message
        ), 500

    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                app.logger.warning(
                    "Could not delete temporary audio file: %s",
                    temp_path
                )


if __name__ == "__main__":
    # Keep the server accessible only from this computer.
    app.run(
        host="127.0.0.1",
        port=8765,
        threaded=True
    )
