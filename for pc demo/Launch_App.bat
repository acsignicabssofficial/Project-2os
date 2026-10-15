@echo off
setlocal
cd /d "%~dp0"
title 2OS Accounting Desktop App

:: ============================================================================
:: 2OS Accounting System - Desktop Launcher
:: Launches the Python desktop engine and closes this CMD window automatically!
:: ============================================================================

set PYTHON_EXEC=

:: 1. Check standard PATH for pythonw (GUI mode without console) or python
where pythonw >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set PYTHON_EXEC=pythonw
    goto :START_APP
)

where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set PYTHON_EXEC=python
    goto :START_APP
)

where py >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set PYTHON_EXEC=py -3
    goto :START_APP
)

:: 2. Check standard Windows Python installation directories
if exist "%LOCALAPPDATA%\Programs\Python\Python313\pythonw.exe" (
    set PYTHON_EXEC="%LOCALAPPDATA%\Programs\Python\Python313\pythonw.exe"
    goto :START_APP
)
if exist "%LOCALAPPDATA%\Programs\Python\Python312\pythonw.exe" (
    set PYTHON_EXEC="%LOCALAPPDATA%\Programs\Python\Python312\pythonw.exe"
    goto :START_APP
)
if exist "%LOCALAPPDATA%\Programs\Python\Python311\pythonw.exe" (
    set PYTHON_EXEC="%LOCALAPPDATA%\Programs\Python\Python311\pythonw.exe"
    goto :START_APP
)
if exist "%LOCALAPPDATA%\Programs\Python\Python310\pythonw.exe" (
    set PYTHON_EXEC="%LOCALAPPDATA%\Programs\Python\Python310\pythonw.exe"
    goto :START_APP
)
if exist "%LOCALAPPDATA%\Programs\Python\Python39\pythonw.exe" (
    set PYTHON_EXEC="%LOCALAPPDATA%\Programs\Python\Python39\pythonw.exe"
    goto :START_APP
)
if exist "%ProgramFiles%\Python313\pythonw.exe" (
    set PYTHON_EXEC="%ProgramFiles%\Python313\pythonw.exe"
    goto :START_APP
)
if exist "%ProgramFiles%\Python312\pythonw.exe" (
    set PYTHON_EXEC="%ProgramFiles%\Python312\pythonw.exe"
    goto :START_APP
)
if exist "%ProgramFiles%\Python311\pythonw.exe" (
    set PYTHON_EXEC="%ProgramFiles%\Python311\pythonw.exe"
    goto :START_APP
)

:: 3. Python not found - prompt user with download link
echo =========================================================================
echo [!] Python 3 was not detected on your Windows system.
echo =========================================================================
echo 2OS Accounting runs 100%% offline using an embedded local Python engine.
echo.
echo Quick Setup:
echo 1. Download Python for Windows: https://www.python.org/downloads/
echo 2. During installation, make sure to check:
echo    "[X] Add python.exe to PATH"
echo 3. Re-run this Launch_App.bat file.
echo =========================================================================
echo.
pause
exit /b 1

:START_APP
:: Start Python application in its own process and immediately close this CMD window
start "" %PYTHON_EXEC% app.py
exit
