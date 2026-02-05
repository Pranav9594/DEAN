@echo off
cd "C:\Users\prana\Desktop\project 2"

REM Configure Git to avoid editor issues
git config --global core.editor "notepad.exe"

REM Pull and merge with message
git pull origin main --allow-unrelated-histories -m "Merge remote changes"

REM Push to GitHub
git push -u origin main

echo.
echo ============================================
echo GitHub Push Complete!
echo Repository: https://github.com/Pranav9594/DEAN.git
echo ============================================
pause
