@echo off
setlocal
title Maggon Camera Ingestor Test
color 0A

echo =====================================================
echo    Maggon Camera Ingestor -- Conectando a Camera
echo =====================================================
echo.

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set "PYTHON_CMD=python"
    goto :PYTHON_FOUND
)

where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set "PYTHON_CMD=py"
    goto :PYTHON_FOUND
)

echo [ERRO] Python nao foi encontrado no seu computador!
echo.
echo Para usar o Maggon Camera, por favor instale o Python:
echo 1. Baixe o Python em: https://www.python.org/downloads
echo 2. Na instalacao, MARQUE a caixa "Add Python to PATH"
echo.
goto :END

:PYTHON_FOUND
echo Python encontrado: %PYTHON_CMD%
%PYTHON_CMD% -c "print('Test OK from Batch!')"

:END
echo Processo finalizado.
