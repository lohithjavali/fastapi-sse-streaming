import React, { useState, useCallback } from 'react';
import { StreamStatus, ChatMessage } from '../types';

interface StreamingComponentProps {
  title: string;
  endpoint: string;
}

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  type: 'sent' | 'received' | 'error' | 'complete';
}

const StreamingComponent: React.FC<StreamingComponentProps> = ({ 
  title, 
  endpoint 
}) => {
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('Hello from React with fetch!');
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const addMessage = useCallback((content: string, type: 'sent' | 'received' | 'error' | 'complete' = 'received') => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      content,
      timestamp: new Date(),
      type
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const startPostStream = useCallback(async () => {
    if (abortController) {
      abortController.abort();
    }

    const controller = new AbortController();
    setAbortController(controller);
    setMessages([]);
    setStatus('connecting');

    // Add the sent message
    addMessage(inputMessage, 'sent');

    const chatMessage: ChatMessage = {
      message: inputMessage,
      user_id: 'react-user'
    };

    try {
      setStatus('streaming');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatMessage),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      addMessage('Starting to receive streamed response...', 'received');

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          addMessage('Stream completed', 'complete');
          setStatus('completed');
          break;
        }

        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.substring(6).trim();
              if (jsonStr) {
                const data = JSON.parse(jsonStr);

                if (data.chunk) {
                  // Add chunk content (for streaming text)
                  addMessage(data.chunk, 'received');
                } else if (data.complete) {
                  addMessage(data.message || 'Processing completed', 'complete');
                  setStatus('completed');
                } else if (data.error) {
                  addMessage(`Error: ${data.error}`, 'error');
                  setStatus('error');
                } else {
                  // Handle other data formats
                  addMessage(JSON.stringify(data, null, 2), 'received');
                }
              }
            } catch (parseError) {
              console.warn('Failed to parse JSON:', jsonStr, parseError);
              // Still show the raw data
              addMessage(line, 'received');
            }
          } else if (line.trim()) {
            // Handle non-SSE formatted data
            addMessage(line, 'received');
          }
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        addMessage('Stream aborted by user', 'complete');
        setStatus('idle');
      } else {
        console.error('Streaming error:', error);
        addMessage(`Error: ${error.message}`, 'error');
        setStatus('error');
      }
    } finally {
      setAbortController(null);
    }
  }, [endpoint, inputMessage, abortController, addMessage]);

  const stopStream = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setStatus('idle');
    }
  }, [abortController]);

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
      case 'sent': return { 
        backgroundColor: '#007bff', 
        color: 'white', 
        alignSelf: 'flex-end',
        marginLeft: '20%'
      };
      case 'error': return { 
        backgroundColor: '#dc3545', 
        color: 'white' 
      };
      case 'complete': return { 
        backgroundColor: '#28a745', 
        color: 'white',
        textAlign: 'center' as const
      };
      default: return { 
        backgroundColor: '#e9ecef', 
        color: '#000000' 
      };
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

      <div style={{ marginBottom: '10px' }}>
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Enter your message..."
          rows={3}
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <button
          onClick={startPostStream}
          disabled={status === 'streaming' || status === 'connecting' || !inputMessage.trim()}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: (status === 'streaming' || !inputMessage.trim()) ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: (status === 'streaming' || !inputMessage.trim()) ? 'not-allowed' : 'pointer'
          }}
        >
          Send POST Stream
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
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {messages.length === 0 ? (
          <div style={{ color: '#666', fontStyle: 'italic' }}>
            No messages yet. Enter a message and click "Send POST Stream" to begin.
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} style={{ 
              padding: '8px 12px',
              borderRadius: '8px',
              maxWidth: '80%',
              wordWrap: 'break-word',
              fontSize: '14px',
              ...getMessageStyle(message.type)
            }}>
              <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
                {message.timestamp.toLocaleTimeString()}
              </div>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {message.content}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ 
        marginTop: '10px', 
        fontSize: '12px', 
        color: '#666',
        fontStyle: 'italic' 
      }}>
        This component uses fetch() with ReadableStream to process streaming responses from POST endpoints.
      </div>
    </div>
  );
};

export default StreamingComponent;
