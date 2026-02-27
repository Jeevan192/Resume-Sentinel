@echo off
echo ============================================
echo   ResumeGuard - Starting All Services
echo ============================================
echo.

echo [1/3] Starting Python FastAPI Backend (port 8000)...
start "ResumeGuard-Backend" cmd /k "cd /d %~dp0backend && pip install -r requirements.txt && python main.py"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo [2/3] Starting Spring Boot Service (port 8080)...
start "ResumeGuard-SpringBoot" cmd /k "cd /d %~dp0spring-boot-service && mvnw.cmd spring-boot:run"

echo [3/3] Starting Streamlit Frontend (port 8501)...
start "ResumeGuard-Frontend" cmd /k "cd /d %~dp0frontend && pip install -r requirements.txt && streamlit run app.py --server.port 8501"

echo.
echo ============================================
echo   All services started!
echo   Frontend: http://localhost:8501
echo   Backend API: http://localhost:8000/docs
echo   Spring Boot: http://localhost:8080
echo   H2 Console: http://localhost:8080/h2-console
echo ============================================
pause
