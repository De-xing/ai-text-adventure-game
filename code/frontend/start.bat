@echo off
setlocal
cd /d "%~dp0"
echo.
echo   EchoQuest / aigame
echo   http://127.0.0.1:8080
echo   Press Ctrl+C to stop.
echo.
start "" cmd /c "timeout /t 1 /nobreak >nul & start http://127.0.0.1:8080/"
where py >nul 2>nul
if %errorlevel%==0 (
  py -m http.server 8080 --bind 127.0.0.1
) else (
  python -m http.server 8080 --bind 127.0.0.1
)
