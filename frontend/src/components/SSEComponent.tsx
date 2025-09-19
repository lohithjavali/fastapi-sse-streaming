import React, { useState, useEffect, useCallback } from 'react';
import { StreamStatus } from '../types';

interface SSEComponentProps {
  title: string;
  endpoint: string;
  autoStart?: boolean;
}

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  type: 'message' | 'error' | 'complete';
}

const SSEComponent: React.FC<SSEComponentProps> = ({ 
  title, 
  endpoint, 
  autoStart = false 
}) => {
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [prompt, setPrompt] = useState<string>('Tell me about FastAPI streaming');

  const addMessage = useCallback((content: string, type: 'message' | 'error' | 'complete' = 'message') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      type
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const startStream = useCallback(() => {
    if (eventSource) {
      eventSource.close();
    }

    setMessages([]);
    setStatus('connecting');

    const url = endpoint.includes('?') 
      ? `${endpoint}&prompt=${encodeURIComponent(prompt)}`
      : `${endpoint}?prompt=${encodeURIComponent(prompt)}`;

    const es = new EventSource(url);
    setEventSource(es);

    es.onopen = () => {
      setStatus('streaming');
      addMessage('Connection established', 'message');
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        addMessage(JSON.stringify(data, null, 2), 'message');
      } catch (error) {
        addMessage(event.data, 'message');
      }
    };

    // Handle custom events
    es.addEventListener('llm_chunk', (event: any) => {
      try {
        const data = JSON.parse(event.data);
        addMessage(data.content, 'message');
      } catch (error) {
        addMessage(event.data, 'message');
      }
    });

    es.addEventListener('llm_complete', (event: any) => {
      addMessage('Stream completed', 'complete');
      setStatus('completed');
      es.close();
    });

    es.addEventListener('progress', (event: any) => {
      try {
        const data = JSON.parse(event.data);
        addMessage(`${data.message} (${data.progress}%)`, 'message');
      } catch (error) {
        addMessage(event.data, 'message');
      }
    });

    es.addEventListener('complete', (event: any) => {
      addMessage('Stream completed', 'complete');
      setStatus('completed');
      es.close();
    });

    es.onerror = (event) => {
      console.error('EventSource failed:', event);
      addMessage('Connection error occurred', 'error');
      setStatus('error');
    };

  }, [endpoint, eventSource, prompt, addMessage]);

  const stopStream = useCallback(() => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
      setStatus('idle');
      addMessage('Stream stopped by user', 'complete');
    }
  }, [eventSource, addMessage]);

  useEffect(() => {
    if (autoStart) {
      startStream();
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [autoStart, startStream, eventSource]);

  const getStatusColor = (status: StreamStatus) => {
    switch (status) {
      case 'connecting': return '#ffa500';
      case 'streaming': return '#00ff00';
      case 'completed': return '#0000ff';
      case 'error': return '#ff0000';
      default: return '#808080';
    }
  };

  const getMessageStyle = (type: string) => {
    switch (type) {
      case 'error': return { color: '#ff0000', fontWeight: 'bold' };
      case 'complete': return { color: '#0000ff', fontWeight: 'bold' };
      default: return { color: '#000000' };
    }
  };

  return (
    <div style={{ 
      border: '1px solid #ccc', 
      borderRadius: '8px', 
      padding: '20px', 
      margin: '20px 0',
      backgroundColor: '#ffffff'
    }}>
      <h3>{title}</h3>

      <div style={{ marginBottom: '10px' }}>
        <span>Status: </span>
        <span style={{ 
          color: getStatusColor(status), 
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }}>
          {status}
        </span>
      </div>

      {endpoint.includes('/llm') && (
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt..."
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>
      )}

      <div style={{ marginBottom: '10px' }}>
        <button
          onClick={startStream}
          disabled={status === 'streaming' || status === 'connecting'}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: status === 'streaming' ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: status === 'streaming' ? 'not-allowed' : 'pointer'
          }}
        >
          Start Stream
        </button>

        <button
          onClick={stopStream}
          disabled={status === 'idle' || status === 'completed'}
          style={{
            padding: '10px 20px',
            backgroundColor: status === 'idle' || status === 'completed' ? '#ccc' : '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: status === 'idle' || status === 'completed' ? 'not-allowed' : 'pointer'
          }}
        >
          Stop Stream
        </button>
      </div>

      <div style={{
        height: '300px',
        overflowY: 'auto',
        border: '1px solid #eee',
        padding: '10px',
        backgroundColor: '#f8f9fa',
        fontFamily: 'monospace',
        fontSize: '14px'
      }}>
        {messages.length === 0 ? (
          <div style={{ color: '#666', fontStyle: 'italic' }}>
            No messages yet. Click "Start Stream" to begin.
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} style={{ 
              marginBottom: '5px',
              ...getMessageStyle(message.type)
            }}>
              <small style={{ color: '#666' }}>
                [{message.timestamp.toLocaleTimeString()}]
              </small>{' '}
              {message.content}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SSEComponent;
