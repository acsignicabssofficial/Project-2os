@echo off
setlocal enabledelayedexpansion
title 2OS Accounting System - PC Demo
cd /d "%~dp0"

cls
echo =====================================================================
echo                2OS ACCOUNTING SYSTEM (PC DEMO)
echo      Philippine BIR & PFRS Double-Entry Accounting Software
echo =====================================================================
echo.
echo [INFO] Initializing 2OS PC Demo Environment...
echo [INFO] Working Directory: %~dp0
echo.

:: Check for python command
where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [INFO] Python found! Launching 2OS Accounting System...
    echo.
    python app.py
    goto end
)

:: Check for py launcher
where py >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [INFO] Python Launcher (py) found! Launching 2OS Accounting System...
    echo.
    py app.py
    goto end
)

:: If Python is not found in PATH
color 0C
echo =====================================================================
echo [ERROR] Python was not found on your PC or is not added to system PATH!
echo =====================================================================
echo.
echo To run this application:
echo 1. Download Python 3.8+ from: https://www.python.org/downloads/
echo 2. Run the installer.
echo 3. IMPORTANT: Check the box "Add Python to PATH" during installation.
echo 4. Then double-click this .bat file again.
echo.
echo =====================================================================
pause
exit /b 1

:end
echo.
echo [INFO] 2OS Accounting System has closed.
pause
