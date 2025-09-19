"""Pydantic models for the streaming application."""

from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class StreamMessage(BaseModel):
    """Model for stream messages."""
    id: str
    event: str
    data: str
    timestamp: datetime


class ChatMessage(BaseModel):
    """Model for chat messages."""
    message: str
    user_id: Optional[str] = "anonymous"


class ProgressUpdate(BaseModel):
    """Model for progress updates."""
    task_id: str
    progress: int  # 0-100
    status: str
    message: Optional[str] = None


class LLMStreamChunk(BaseModel):
    """Model for LLM streaming chunks."""
    content: str
    chunk_id: int
    is_final: bool = False
    metadata: Optional[Dict[str, Any]] = None
