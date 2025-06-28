import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [file, setFile] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setYoutubeUrl(''); // Clear the other input
  };

  const handleUrlChange = (event) => {
    setYoutubeUrl(event.target.value);
    setFile(null); // Clear the other input
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file && !youtubeUrl) {
      setError('Please provide a file or a YouTube URL.');
      return;
    }

    setLoading(true);
    setTranscription('');
    setError('');

    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    } else {
      formData.append('youtube_url', youtubeUrl);
    }

    try {
      // The backend is running on port 8000
      const response = await axios.post('http://localhost:8000/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setTranscription(response.data.transcription);
    } catch (err) {
      setError('An error occurred during transcription. Please check the server logs and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Subtitle Generator</h1>
        <p>Generate subtitles from a video file or a YouTube link.</p>
      </header>
      <main>
        <form onSubmit={handleSubmit} className="transcribe-form">
          <div className="input-group">
            <label htmlFor="youtube-url">YouTube URL</label>
            <input
              id="youtube-url"
              type="text"
              placeholder="e.g., https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={handleUrlChange}
              disabled={loading || file}
            />
          </div>
          <div className="separator">OR</div>
          <div className="input-group">
            <label htmlFor="file-upload">Upload a Video/Audio File</label>
            <input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              disabled={loading || youtubeUrl}
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Subtitles'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}

        {transcription && (
          <div className="transcription-result">
            <h2>Transcription:</h2>
            <textarea readOnly value={transcription} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
