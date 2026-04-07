$VPS_IP = "86.107.77.240"
$VPS_USER = "root" 
$REMOTE_DIR = "/var/www/aipcore"

Write-Host "🚀 Starting Docker Deployment to $VPS_IP..." -ForegroundColor Cyan
Write-Host "Please ensure 'dist' is built if not already present." -ForegroundColor Yellow

# 1. Build Production Frontend (Optional if already built)
# Write-Host "[1/4] Building Frontend..." -ForegroundColor Gray
# npm run build

Write-Host "[1/2] Syncing changes to GitHub..." -ForegroundColor Gray
git add .
git commit -m "deploy: final registration fixes + matrix structure sync"
git push origin main

Write-Host "[2/2] Updating VPS and Orchestrating Docker..." -ForegroundColor Gray
# Note: We CD into the specific subdirectory where the Docker config now lives
ssh ${VPS_USER}@${VPS_IP} "cd ${REMOTE_DIR} && git pull origin main && cd archive_legacy_v1 && docker compose down && docker compose up -d --build"

# 4. Final Cleanup
Write-Host "[4/4] Verifying Containers..." -ForegroundColor Gray
ssh ${VPS_USER}@${VPS_IP} "docker ps"

Write-Host "✅ Deployment Complete! Your AIPCore App is now running in Docker." -ForegroundColor Green
