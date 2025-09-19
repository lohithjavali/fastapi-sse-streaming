#!/bin/bash

# FastAPI SSE Streaming - Test Script
# This script tests the streaming functionality

set -e

# Configuration
SERVICE_URL=${1:-"http://localhost:8080"}

echo "🧪 Testing FastAPI SSE Streaming"
echo "Service URL: $SERVICE_URL"
echo ""

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local description=$2
    local method=${3:-"GET"}
    local data=${4:-""}

    echo "Testing: $description"
    echo "URL: $SERVICE_URL$endpoint"
    echo "Method: $method"

    if [ "$method" = "GET" ]; then
        echo "Response:"
        curl -s -N --max-time 10 "$SERVICE_URL$endpoint" | head -20
    else
        echo "Response:"
        curl -s -X "$method" \
             -H "Content-Type: application/json" \
             -d "$data" \
             --max-time 10 \
             "$SERVICE_URL$endpoint" | head -20
    fi

    echo ""
    echo "---"
    echo ""
}

# Test health endpoint
test_endpoint "/health" "Health Check"

# Test basic streaming
echo "🔴 Testing Basic Stream (will stop after 10 seconds):"
test_endpoint "/stream" "Basic SSE Stream"

# Test LLM streaming
echo "🤖 Testing LLM Stream (will stop after 10 seconds):"
test_endpoint "/stream/llm?prompt=Hello%20FastAPI" "LLM SSE Stream"

# Test progress streaming
echo "📊 Testing Progress Stream (will stop after 10 seconds):"
test_endpoint "/stream/progress/test-task" "Progress SSE Stream"

# Test POST streaming
echo "📮 Testing POST Stream (will stop after 10 seconds):"
test_endpoint "/stream/post" "POST Stream" "POST" '{"message": "Hello from test script", "user_id": "test-user"}'

echo "✅ All tests completed!"
echo ""
echo "💡 To test interactively, visit: $SERVICE_URL/demo"
echo "📚 API documentation: $SERVICE_URL/docs"
