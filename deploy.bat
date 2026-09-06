@echo off
title Deploy to GitHub - AMMAR Link Hub
color 0b
echo ========================================================
echo       AMMAR 3D LINK HUB - GITHUB DEPLOYER
echo ========================================================
echo.

echo Checking repository status...
git status

echo.
echo Pushing commits to https://github.com/hadjx/ammar-hub.git ...
echo (A GitHub login window may pop up in your browser - please approve it)
echo.

git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo [SUCCESS] PUSH COMPLETED SUCCESSFULLY!
    echo ========================================================
    echo.
    echo 1. Open GitHub Pages settings:
    echo    https://github.com/hadjx/ammar-hub/settings/pages
    echo.
    echo 2. Set "Source" to "Deploy from a branch"
    echo 3. Select branch "main" and folder "/ (root)"
    echo 4. Click SAVE!
    echo.
    echo --------------------------------------------------------
    echo YOUR LIVE LINKS (Ready in 1-2 minutes):
    echo Main Site:  https://hadjx.github.io/ammar-hub/
    echo Admin Page: https://hadjx.github.io/ammar-hub/admin.html
    echo --------------------------------------------------------
) else (
    echo.
    echo ========================================================
    echo [NOTICE] If push failed:
    echo 1. Make sure repo exists: https://github.com/new
    echo    Repository name: ammar-hub (Set to Public)
    echo 2. Run this file again!
    echo ========================================================
)

echo.
pause
