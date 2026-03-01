@echo off
title Antigravity + Telegram Bridge
cd /d "%~dp0"

echo 🛑 Killing previous Node processes...
taskkill /F /IM node.exe /T 2>nul

echo 🚀 Starting Antigravity Server...
start "Antigravity Server" cmd /c "node server.js"

echo ⏳ Waiting for server to initialize...
timeout /t 5 /nobreak >nul

echo 🤖 Starting Telegram Bridge...
node telegram_bridge.js

pause
