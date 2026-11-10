@echo off
echo =====================================================================
echo  Deploy Projetos Allan Santos para GitHub
echo  Repositorio: https://github.com/carlososf/AllanDashbord.git
echo =====================================================================
git push -u origin main
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCESSO] Deploy realizado com sucesso para o GitHub!
) else (
    echo.
    echo [AVISO] Falha ao enviar. Se for solicitado login, autentique-se no navegador ou forneca seu Personal Access Token (PAT).
)
echo =====================================================================
pause
