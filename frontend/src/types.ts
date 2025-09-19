// TypeScript type definitions for the streaming application

export interface StreamMessage {
  id: string;
  event: string;
  data: string;
  timestamp: string;
}

export interface ChatMessage {
  message: string;
  user_id?: string;
}

export interface ProgressUpdate {
  task_id: string;
  progress: number;
  status: string;
  message?: string;
}

export interface LLMStreamChunk {
  content: string;
  chunk_id: number;
  is_final: boolean;
  metadata?: Record<string, any>;
}

export interface StreamingComponentProps {
  apiUrl: string;
  title: string;
}

export interface SSEMessage {
  data: string;
  event?: string;
  id?: string;
}

export type StreamStatus = 'idle' | 'connecting' | 'streaming' | 'completed' | 'error';

export interface StreamState {
  status: StreamStatus;
  messages: string[];
  error?: string;
}
