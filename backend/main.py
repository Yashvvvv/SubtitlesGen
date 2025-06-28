import fastapi
import whisper
import yt_dlp
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import os
import time

app = FastAPI()

# Configure CORS
origins = [
    "http://localhost:3000",  # Allow React frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the Whisper model
# Using the "tiny" model for faster processing. You can change this to "base", "small", "medium", or "large"
# for better accuracy at the cost of speed.
model = whisper.load_model("tiny")

TEMP_DIR = "temp_audio"
os.makedirs(TEMP_DIR, exist_ok=True)

@app.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(None),
    youtube_url: str = Form(None)
):
    """
    This endpoint transcribes audio from either an uploaded file or a YouTube URL.
    """
    if file is None and youtube_url is None:
        return fastapi.Response(content="Either a file or a YouTube URL must be provided.", status_code=400)

    try:
        if file:
            # Handle file upload
            file_path = os.path.join(TEMP_DIR, f"{time.time()}_{file.filename}")
            with open(file_path, "wb") as buffer:
                buffer.write(await file.read())
            
            audio_source = file_path

        else:
            # Handle YouTube URL
            ydl_opts = {
                'format': 'bestaudio/best',
                'outtmpl': os.path.join(TEMP_DIR, 'youtube_audio.%(ext)s'),
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([youtube_url])
            
            # Find the downloaded audio file
            audio_source = os.path.join(TEMP_DIR, 'youtube_audio.mp3')

        # Transcribe the audio
        result = model.transcribe(audio_source)
        transcription = result["text"]

        return {"transcription": transcription}

    except Exception as e:
        return fastapi.Response(content=f"Error processing audio: {str(e)}", status_code=500)
    finally:
        # Clean up temporary files
        if 'audio_source' in locals() and os.path.exists(audio_source):
            os.remove(audio_source)
        if file and 'file_path' in locals() and os.path.exists(file_path):
             os.remove(file_path)


@app.get("/")
def read_root():
    return {"message": "Welcome to the Subtitle Generator API"} 