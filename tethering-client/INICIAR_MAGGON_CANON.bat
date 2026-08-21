@echo off
title Maggon Câmera Ingestor
cd /d "%~dp0"
echo ===================================================
echo    Iniciando o Ingestor de Fotos Maggon Câmera...
echo ===================================================
python gui_launcher.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Ocorreu um erro ao abrir a interface gráfica.
    pause
)
