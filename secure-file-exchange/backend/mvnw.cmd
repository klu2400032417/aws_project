@echo off
setlocal

set "DEFAULT_MVN=C:\Users\ASUS\.m2\wrapper\dists\apache-maven-3.9.12\59fe215c0ad6947fea90184bf7add084544567b927287592651fda3782e0e798\bin\mvn.cmd"

if exist "%DEFAULT_MVN%" (
    call "%DEFAULT_MVN%" %*
) else (
    where mvn >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        call mvn %*
    ) else (
        echo [ERROR] Maven not found. Please ensure Java and Maven are installed.
        exit /b 1
    )
)
endlocal
