@echo off
chcp 65001 > nul
title Cotisation Pro

:: Utiliser PowerShell pour un demarrage fiable
powershell -ExecutionPolicy Bypass -File "%~dp0demarrer.ps1"
