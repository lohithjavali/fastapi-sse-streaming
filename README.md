# FastAPI SSE Streaming on Google Cloud Run

A comprehensive demonstration of **Server-Sent Events (SSE)** streaming with **FastAPI** deployed on **Google Cloud Run**, featuring both EventSource API and fetch with ReadableStream consumption patterns.

## 🌟 Features

- **FastAPI Backend** with multiple streaming endpoints
- **Server-Sent Events (SSE)** implementation using `sse-starlette`
- **React TypeScript Frontend** with two consumption methods:
  - EventSource API for GET requests
  - fetch + ReadableStream for POST requests
- **Google Cloud Run** deployment with proper streaming configuration
- **Real-time streaming** for LLM-like responses, progress updates, and chat
- **Built-in demo page** for easy testing

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+
- Google Cloud CLI (`gcloud`)
- Google Cloud Project with billing enabled
- Docker (optional, for local containerized testing)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Extract the downloaded project
unzip fastapi-sse-streaming.zip
cd fastapi-sse-streaming
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run locally
python -m uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

### 3. Frontend Setup (Optional)

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm start
```

### 4. Test Locally

Visit:
- Backend API: http://localhost:8080
- Demo page: http://localhost:8080/demo
- API docs: http://localhost:8080/docs
- React frontend: http://localhost:3000 (if running)

## 🌐 Deploy to Google Cloud Run

### Automated Deployment

```bash
# Set your project ID
export GOOGLE_CLOUD_PROJECT="your-project-id"

# Make deployment script executable and run it
chmod +x deployment/deploy.sh
./deployment/deploy.sh
```

### Manual Deployment

```bash
# Set project and enable APIs
gcloud config set project YOUR_PROJECT_ID
gcloud services enable cloudbuild.googleapis.com run.googleapis.com

# Deploy from source
cd backend
gcloud run deploy fastapi-sse-streaming \
    --source . \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --timeout 300
```

## 📡 API Endpoints

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information and available endpoints |
| `/health` | GET | Health check for Cloud Run |
| `/demo` | GET | Built-in HTML demo page |

### Streaming Endpoints

| Endpoint | Method | Type | Description |
|----------|--------|------|-------------|
| `/stream` | GET | SSE | Basic streaming with messages every 2 seconds |
| `/stream/llm` | GET | SSE | LLM-style word-by-word streaming |
| `/stream/progress/{task_name}` | GET | SSE | Progress updates for long-running tasks |
| `/stream/post` | POST | SSE | Streaming response to POST requests |

### Example Usage

```bash
# Basic streaming
curl -N https://your-service-url.run.app/stream

# LLM streaming with custom prompt
curl -N "https://your-service-url.run.app/stream/llm?prompt=Tell%20me%20about%20Python"

# Progress streaming
curl -N https://your-service-url.run.app/stream/progress/data-processing

# POST streaming
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","user_id":"test"}' \
  -N https://your-service-url.run.app/stream/post
```

## 🔧 Testing

### Use Test Script

```bash
# Test deployed service
chmod +x deployment/test-streaming.sh
./deployment/test-streaming.sh https://your-service-url.run.app

# Test local development
./deployment/test-streaming.sh http://localhost:8080
```

### Manual Testing

1. **Using curl:**
   ```bash
   # Test basic streaming
   curl -N https://your-service-url.run.app/stream

   # Test with timeout
   timeout 10 curl -N https://your-service-url.run.app/stream
   ```

2. **Using the demo page:**
   - Visit `https://your-service-url.run.app/demo`
   - Test different streaming endpoints interactively

3. **Using the React frontend:**
   - Deploy frontend to your preferred hosting (Vercel, Netlify, etc.)
   - Update `REACT_APP_API_URL` to your Cloud Run service URL

## 🛠️ Development

### Project Structure

```
fastapi-sse-streaming/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application
│   │   ├── streaming.py     # Streaming service logic
│   │   ├── models.py        # Pydantic models
│   │   └── __init__.py
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile          # Container configuration
│   └── cloudbuild.yaml    # Cloud Build configuration
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SSEComponent.tsx      # EventSource implementation
│   │   │   └── StreamingComponent.tsx # fetch + ReadableStream
│   │   ├── App.tsx         # Main React application
│   │   ├── types.ts        # TypeScript definitions
│   │   └── index.tsx       # React entry point
│   ├── public/
│   │   └── index.html      # HTML template
│   ├── package.json        # Node.js dependencies
│   └── tsconfig.json       # TypeScript configuration
├── deployment/
│   ├── deploy.sh           # Deployment automation
│   └── test-streaming.sh   # Testing script
├── README.md               # This file
└── .gitignore             # Git ignore rules
```

### Local Development

1. **Backend Development:**
   ```bash
   cd backend
   pip install -r requirements.txt
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
   ```

2. **Frontend Development:**
   ```bash
   cd frontend
   npm install
   REACT_APP_API_URL=http://localhost:8080 npm start
   ```

## 📊 Monitoring and Logs

```bash
# View logs
gcloud logs tail --resource.type=cloud_run_revision \
  --resource.labels.service_name=fastapi-sse-streaming

# Check service status
gcloud run services describe fastapi-sse-streaming \
  --region us-central1
```

## 🚨 Troubleshooting

### Common Issues

1. **Streaming not working on Cloud Run:**
   - Ensure `Transfer-Encoding: chunked` header is set
   - Verify HTTP/2 is enabled
   - Check that responses are not being buffered

2. **CORS issues with frontend:**
   - Update CORS configuration in `main.py`
   - Add your frontend domain to allowed origins

3. **Connection timeouts:**
   - Adjust Cloud Run timeout settings
   - Implement proper client disconnection handling

## 💡 Use Cases

This implementation is perfect for:

- **Real-time chat applications**
- **Live data dashboards**
- **Progress indicators for long-running tasks**
- **LLM/AI streaming responses**
- **Live notifications and alerts**
- **Real-time collaboration tools**

## 📄 License

MIT License - feel free to use this project as a starting point for your own applications.

---

Built with ❤️ using FastAPI, React, and Google Cloud Run
