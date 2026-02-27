#!/bin/bash
echo "============================================"
echo "  ResumeGuard - Starting All Services"
echo "============================================"
echo ""

echo "[1/3] Starting Python FastAPI Backend (port 8000)..."
cd backend && pip install -r requirements.txt && python main.py &
BACKEND_PID=$!

echo "Waiting for backend..."
sleep 5

echo "[2/3] Starting Spring Boot Service (port 8080)..."
cd ../spring-boot-service && ./mvnw spring-boot:run &
SPRING_PID=$!

echo "[3/3] Starting Streamlit Frontend (port 8501)..."
cd ../frontend && pip install -r requirements.txt && streamlit run app.py --server.port 8501 &
FRONTEND_PID=$!

echo ""
echo "============================================"
echo "  All services started!"
echo "  Frontend: http://localhost:8501"
echo "  Backend API: http://localhost:8000/docs"
echo "  Spring Boot: http://localhost:8080"
echo "============================================"

wait
