@echo off
set "PATH=%LOCALAPPDATA%\Programs\MinGit\cmd;%PATH%"
echo =====================================================================
echo  Deploy Projetos Allan Santos para GitHub
echo  Repositorio: https://github.com/carlososf/AllanDashbord.git
echo =====================================================================
git.exe push -u origin main
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCESSO] Deploy realizado com sucesso para o GitHub!
) else (
    echo.
    echo [AVISO] Se precisar, informe seu Personal Access Token (PAT) do GitHub.
)
echo =====================================================================
pause
