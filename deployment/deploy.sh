#!/bin/bash

# FastAPI SSE Streaming - Cloud Run Deployment Script
# This script builds and deploys the FastAPI application to Google Cloud Run

set -e  # Exit on any error

# Configuration
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-"your-project-id"}
REGION=${GOOGLE_CLOUD_REGION:-"us-central1"}
SERVICE_NAME="fastapi-sse-streaming"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "🚀 Deploying FastAPI SSE Streaming to Cloud Run"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Name: $SERVICE_NAME"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not authenticated with gcloud. Please run: gcloud auth login"
    exit 1
fi

# Set the project
echo "📋 Setting up Google Cloud project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and deploy using Cloud Build (recommended)
echo "🏗️  Building and deploying with Cloud Build..."
cd backend

# Option 1: Deploy from source (Cloud Build will handle Dockerfile)
gcloud run deploy $SERVICE_NAME \
    --source . \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --max-instances 10 \
    --timeout 300 \
    --set-env-vars "ENVIRONMENT=production"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region $REGION \
    --format "value(status.address.url)")

echo ""
echo "✅ Deployment completed successfully!"
echo "🌐 Service URL: $SERVICE_URL"
echo ""
echo "🧪 Test endpoints:"
echo "  Health check: $SERVICE_URL/health"
echo "  Basic stream: $SERVICE_URL/stream"
echo "  LLM stream: $SERVICE_URL/stream/llm?prompt=Hello"
echo "  Demo page: $SERVICE_URL/demo"
echo ""
echo "📱 To test streaming:"
echo "  curl -N $SERVICE_URL/stream"
echo ""
echo "🔧 To view logs:"
echo "  gcloud logs tail --resource.type=cloud_run_revision --resource.labels.service_name=$SERVICE_NAME"
