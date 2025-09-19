import React from 'react';
import SSEComponent from './components/SSEComponent';
import StreamingComponent from './components/StreamingComponent';

// Configuration - change this to your deployed Cloud Run URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const App: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <header style={{ 
          textAlign: 'center', 
          marginBottom: '40px',
          borderBottom: '2px solid #e9ecef',
          paddingBottom: '20px'
        }}>
          <h1 style={{ 
            color: '#333',
            fontSize: '2.5rem',
            marginBottom: '10px'
          }}>
            FastAPI SSE Streaming Demo
          </h1>
          <p style={{ 
            color: '#666',
            fontSize: '1.1rem',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Demonstration of Server-Sent Events with FastAPI backend deployed on Google Cloud Run
          </p>
          <div style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: '#e7f3ff',
            borderRadius: '8px',
            border: '1px solid #b3d9ff'
          }}>
            <strong>API Endpoint:</strong> {API_BASE_URL}
          </div>
        </header>

        <main>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: '20px',
            marginBottom: '40px'
          }}>

            {/* Basic SSE Stream */}
            <SSEComponent
              title="📡 Basic SSE Stream"
              endpoint={`${API_BASE_URL}/stream`}
            />

            {/* LLM-style Streaming */}
            <SSEComponent
              title="🤖 LLM-Style Streaming"
              endpoint={`${API_BASE_URL}/stream/llm`}
            />

            {/* Progress Stream */}
            <SSEComponent
              title="📊 Progress Stream"
              endpoint={`${API_BASE_URL}/stream/progress/data-processing`}
            />

            {/* POST with Streaming Response */}
            <StreamingComponent
              title="📮 POST Stream (fetch + ReadableStream)"
              endpoint={`${API_BASE_URL}/stream/post`}
            />

          </div>

          {/* Information Section */}
          <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '20px',
            marginTop: '30px'
          }}>
            <h3 style={{ marginTop: '0', color: '#495057' }}>
              🔧 Implementation Details
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginTop: '15px'
            }}>
              <div>
                <h4 style={{ color: '#007bff', marginBottom: '10px' }}>
                  EventSource API (SSE)
                </h4>
                <ul style={{ margin: '0', paddingLeft: '20px', color: '#666' }}>
                  <li>Built-in browser API</li>
                  <li>Automatic reconnection</li>
                  <li>Event-based messaging</li>
                  <li>GET requests only</li>
                </ul>
              </div>

              <div>
                <h4 style={{ color: '#28a745', marginBottom: '10px' }}>
                  Fetch + ReadableStream
                </h4>
                <ul style={{ margin: '0', paddingLeft: '20px', color: '#666' }}>
                  <li>Supports POST requests</li>
                  <li>Custom headers and body</li>
                  <li>Manual stream processing</li>
                  <li>Full control over connection</li>
                </ul>
              </div>

              <div>
                <h4 style={{ color: '#dc3545', marginBottom: '10px' }}>
                  Cloud Run Features
                </h4>
                <ul style={{ margin: '0', paddingLeft: '20px', color: '#666' }}>
                  <li>HTTP/2 streaming support</li>
                  <li>Automatic scaling</li>
                  <li>Serverless deployment</li>
                  <li>Built-in load balancing</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Usage Instructions */}
          <div style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            padding: '20px',
            marginTop: '20px'
          }}>
            <h3 style={{ marginTop: '0', color: '#856404' }}>
              📝 Usage Instructions
            </h3>
            <ol style={{ color: '#856404', lineHeight: '1.6' }}>
              <li><strong>Basic SSE Stream:</strong> Click "Start Stream" to receive server messages every 2 seconds</li>
              <li><strong>LLM-Style Streaming:</strong> Enter a prompt and see word-by-word streaming response</li>
              <li><strong>Progress Stream:</strong> Watch real-time progress updates for a simulated task</li>
              <li><strong>POST Stream:</strong> Send a message via POST and receive a streaming response</li>
            </ol>
            <p style={{ margin: '15px 0 0 0', color: '#856404' }}>
              <strong>Note:</strong> Make sure your FastAPI backend is running on the configured endpoint.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
