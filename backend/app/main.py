"""Main FastAPI application with streaming endpoints."""

import os
import asyncio
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse
from sse_starlette.sse import EventSourceResponse

from .models import ChatMessage, StreamMessage
from .streaming import streaming_service

# Initialize FastAPI app
app = FastAPI(
    title="FastAPI SSE Streaming Demo",
    description="Demonstration of Server-Sent Events with FastAPI for Cloud Run",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "FastAPI SSE Streaming API",
        "version": "1.0.0",
        "endpoints": {
            "basic_stream": "/stream",
            "llm_stream": "/stream/llm",
            "progress_stream": "/stream/progress/{task_name}",
            "post_stream": "/stream/post"
        },
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for Cloud Run."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "fastapi-sse-streaming"
    }


@app.get("/stream")
async def basic_stream(request: Request):
    """Basic SSE endpoint - streams messages every 2 seconds."""
    return EventSourceResponse(streaming_service.stream_events(request))


@app.get("/stream/llm")
async def llm_stream(request: Request, prompt: str = "Tell me about FastAPI streaming"):
    """Stream LLM-like responses chunk by chunk."""
    return EventSourceResponse(streaming_service.simulate_llm_streaming(prompt, request))


@app.get("/stream/progress/{task_name}")
async def progress_stream(request: Request, task_name: str):
    """Stream progress updates for a long-running task."""
    return EventSourceResponse(streaming_service.simulate_progress_task(task_name, request))


@app.post("/stream/post")
async def post_stream(request: Request, message: ChatMessage):
    """POST endpoint with streaming response using fetch + ReadableStream."""

    async def generate_response():
        """Generate streaming response for POST request."""
        try:
            # Acknowledge the received message
            response_text = f"Processing your message: '{message.message}'"

            # Split response into chunks
            words = response_text.split()

            for i, word in enumerate(words):
                if await request.is_disconnected():
                    break

                # Format as SSE for compatibility
                chunk = f"data: {{'chunk': '{word} ', 'index': {i}, 'user_id': '{message.user_id}'}}\n\n"
                yield chunk.encode()

                await asyncio.sleep(0.2)  # Simulate processing time

            # Send completion marker
            final_chunk = f"data: {{'complete': true, 'message': 'Processing completed'}}\n\n"
            yield final_chunk.encode()

        except Exception as e:
            error_chunk = f"data: {{'error': 'Processing failed: {str(e)}'}}\n\n"
            yield error_chunk.encode()

    return StreamingResponse(
        generate_response(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
        }
    )


@app.get("/demo")
async def demo_page():
    """Simple HTML demo page for testing."""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>FastAPI SSE Demo</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 800px; margin: 0 auto; }
            .stream-box { 
                border: 1px solid #ccc; 
                padding: 20px; 
                margin: 20px 0; 
                height: 200px; 
                overflow-y: scroll; 
                background-color: #f9f9f9;
            }
            button { 
                padding: 10px 20px; 
                margin: 10px; 
                background-color: #007bff; 
                color: white; 
                border: none; 
                border-radius: 4px; 
                cursor: pointer;
            }
            button:hover { background-color: #0056b3; }
            input[type="text"] { 
                padding: 8px; 
                margin: 10px; 
                width: 300px; 
                border: 1px solid #ccc; 
                border-radius: 4px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>FastAPI SSE Streaming Demo</h1>

            <h2>Basic Stream</h2>
            <button onclick="startBasicStream()">Start Basic Stream</button>
            <button onclick="stopStream('basic')">Stop</button>
            <div id="basic-stream" class="stream-box"></div>

            <h2>LLM Stream</h2>
            <input type="text" id="llm-prompt" placeholder="Enter your prompt..." value="Tell me about Python">
            <button onclick="startLLMStream()">Start LLM Stream</button>
            <button onclick="stopStream('llm')">Stop</button>
            <div id="llm-stream" class="stream-box"></div>

            <h2>Progress Stream</h2>
            <input type="text" id="task-name" placeholder="Task name..." value="data-processing">
            <button onclick="startProgressStream()">Start Progress Stream</button>
            <button onclick="stopStream('progress')">Stop</button>
            <div id="progress-stream" class="stream-box"></div>

            <h2>POST Stream (Fetch + ReadableStream)</h2>
            <input type="text" id="post-message" placeholder="Enter message..." value="Hello from POST request">
            <button onclick="startPostStream()">Start POST Stream</button>
            <div id="post-stream" class="stream-box"></div>
        </div>

        <script>
            let eventSources = {};

            function addMessage(containerId, message) {
                const container = document.getElementById(containerId);
                const messageElement = document.createElement('div');
                messageElement.textContent = new Date().toLocaleTimeString() + ': ' + message;
                container.appendChild(messageElement);
                container.scrollTop = container.scrollHeight;
            }

            function startBasicStream() {
                stopStream('basic');
                eventSources.basic = new EventSource('/stream');

                eventSources.basic.onmessage = function(event) {
                    const data = JSON.parse(event.data);
                    addMessage('basic-stream', `Message: ${data.data}`);
                };

                eventSources.basic.addEventListener('complete', function(event) {
                    addMessage('basic-stream', 'Stream completed!');
                    stopStream('basic');
                });

                eventSources.basic.onerror = function(event) {
                    addMessage('basic-stream', 'Error occurred');
                };
            }

            function startLLMStream() {
                stopStream('llm');
                const prompt = document.getElementById('llm-prompt').value;
                eventSources.llm = new EventSource(`/stream/llm?prompt=${encodeURIComponent(prompt)}`);

                eventSources.llm.addEventListener('llm_chunk', function(event) {
                    const data = JSON.parse(event.data);
                    addMessage('llm-stream', data.content);
                });

                eventSources.llm.addEventListener('llm_complete', function(event) {
                    addMessage('llm-stream', '--- LLM Response Complete ---');
                    stopStream('llm');
                });
            }

            function startProgressStream() {
                stopStream('progress');
                const taskName = document.getElementById('task-name').value;
                eventSources.progress = new EventSource(`/stream/progress/${encodeURIComponent(taskName)}`);

                eventSources.progress.addEventListener('progress', function(event) {
                    const data = JSON.parse(event.data);
                    addMessage('progress-stream', `${data.message} (${data.progress}%)`);
                });
            }

            async function startPostStream() {
                const message = document.getElementById('post-message').value;
                const container = document.getElementById('post-stream');
                container.innerHTML = '';

                try {
                    const response = await fetch('/stream/post', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            message: message,
                            user_id: 'demo-user'
                        })
                    });

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\n');

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const data = JSON.parse(line.substring(6));
                                    if (data.chunk) {
                                        addMessage('post-stream', data.chunk);
                                    } else if (data.complete) {
                                        addMessage('post-stream', '--- POST Stream Complete ---');
                                    }
                                } catch (e) {
                                    // Ignore parsing errors for incomplete chunks
                                }
                            }
                        }
                    }
                } catch (error) {
                    addMessage('post-stream', `Error: ${error.message}`);
                }
            }

            function stopStream(type) {
                if (eventSources[type]) {
                    eventSources[type].close();
                    delete eventSources[type];
                    addMessage(type + '-stream', '--- Stream Stopped ---');
                }
            }

            // Cleanup on page unload
            window.addEventListener('beforeunload', function() {
                Object.values(eventSources).forEach(source => source.close());
            });
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
