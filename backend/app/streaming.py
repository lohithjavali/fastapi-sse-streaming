"""Streaming functionality for Server-Sent Events."""

import asyncio
import json
import time
from datetime import datetime
from typing import AsyncGenerator, Optional
from sse_starlette.sse import EventSourceResponse
from .models import StreamMessage, ProgressUpdate, LLMStreamChunk


class StreamingService:
    """Service for handling various types of streaming operations."""

    def __init__(self):
        self.active_connections = set()

    async def stream_events(self, request) -> AsyncGenerator[dict, None]:
        """Generate Server-Sent Events for basic streaming."""
        try:
            counter = 0
            while True:
                # Check if client disconnected
                if await request.is_disconnected():
                    break

                counter += 1
                message = StreamMessage(
                    id=str(counter),
                    event="message",
                    data=f"Server message #{counter} at {datetime.now().isoformat()}",
                    timestamp=datetime.now()
                )

                yield {
                    "event": "message",
                    "id": str(counter),
                    "data": message.model_dump_json()
                }

                await asyncio.sleep(2)  # Send message every 2 seconds

                # Stop after 10 messages for demo purposes
                if counter >= 10:
                    yield {
                        "event": "complete",
                        "id": str(counter + 1),
                        "data": json.dumps({"message": "Stream completed"})
                    }
                    break

        except asyncio.CancelledError:
            # Client disconnected
            pass

    async def simulate_llm_streaming(self, prompt: str, request) -> AsyncGenerator[dict, None]:
        """Simulate LLM response streaming like ChatGPT."""
        try:
            # Simulated LLM response
            full_response = f"""This is a simulated LLM response to your prompt: "{prompt}".

This streaming response demonstrates how you can implement real-time text generation 
similar to ChatGPT or other language models. Each chunk of text is sent as it becomes 
available, providing a better user experience than waiting for the complete response.

The streaming approach is particularly useful for:
1. Long-form content generation
2. Real-time chat applications  
3. Progressive content delivery
4. Better perceived performance

This completes the simulated streaming response."""

            words = full_response.split()
            chunk_id = 0

            for i, word in enumerate(words):
                # Check if client disconnected
                if await request.is_disconnected():
                    break

                chunk_id += 1
                is_final = (i == len(words) - 1)

                chunk = LLMStreamChunk(
                    content=word + " ",
                    chunk_id=chunk_id,
                    is_final=is_final,
                    metadata={"progress": round((i + 1) / len(words) * 100)}
                )

                yield {
                    "event": "llm_chunk",
                    "id": str(chunk_id),
                    "data": chunk.model_dump_json()
                }

                # Simulate processing time
                await asyncio.sleep(0.1)

            # Send completion event
            yield {
                "event": "llm_complete",
                "id": str(chunk_id + 1),
                "data": json.dumps({"message": "LLM response completed"})
            }

        except asyncio.CancelledError:
            pass

    async def simulate_progress_task(self, task_name: str, request) -> AsyncGenerator[dict, None]:
        """Simulate a long-running task with progress updates."""
        try:
            task_id = f"task_{int(time.time())}"
            total_steps = 20

            for step in range(total_steps + 1):
                # Check if client disconnected
                if await request.is_disconnected():
                    break

                progress = int((step / total_steps) * 100)
                status = "in_progress" if step < total_steps else "completed"

                update = ProgressUpdate(
                    task_id=task_id,
                    progress=progress,
                    status=status,
                    message=f"Processing {task_name} - Step {step}/{total_steps}"
                )

                yield {
                    "event": "progress",
                    "id": str(step),
                    "data": update.model_dump_json()
                }

                await asyncio.sleep(0.5)  # Simulate work

        except asyncio.CancelledError:
            pass


# Global streaming service instance
streaming_service = StreamingService()
