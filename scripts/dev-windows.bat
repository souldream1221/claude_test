@echo off
chcp 65001 >nul
echo ==========================================
echo UFS Test Application - Windows Dev Mode
echo ==========================================
echo.

REM Check prerequisites
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed
    exit /b 1
)

rustc --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Rust is not installed
    exit /b 1
)

echo Starting development server...
echo.
npm run tauri-dev
