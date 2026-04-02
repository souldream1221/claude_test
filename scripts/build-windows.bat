@echo off
chcp 65001 >nul
echo ==========================================
echo UFS Test Application - Windows Build Script
echo ==========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)

REM Check if Rust is installed
rustc --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Rust is not installed or not in PATH
    echo Please install Rust from https://rustup.rs/
    exit /b 1
)

echo [1/4] Installing Node.js dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install Node.js dependencies
    exit /b 1
)

echo.
echo [2/4] Installing Rust dependencies...
cd src-tauri
call cargo fetch
if errorlevel 1 (
    echo [ERROR] Failed to install Rust dependencies
    exit /b 1
)
cd ..

echo.
echo [3/4] Building Tauri application for Windows...
call npm run tauri-build
if errorlevel 1 (
    echo [ERROR] Failed to build application
    exit /b 1
)

echo.
echo [4/4] Build complete!
echo.
echo The application installer is located at:
echo   src-tauri\target\release\bundle\msi\
echo   src-tauri\target\release\bundle\nsis\
echo.
pause
