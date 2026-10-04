@echo off
cd /d "%~dp0"
python app.py || py app.py
pause
