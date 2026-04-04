$VPS_IP = "86.107.77.237"
$VPS_USER = "root" 
$REMOTE_DIR = "/var/www/aipcore"

Write-Host "🚀 Starting FAST deployment to $VPS_IP (skipping build)..." -ForegroundColor Cyan
Write-Host "You may be prompted for your VPS password multiple times." -ForegroundColor Yellow

echo '[1/3] Copying Built Frontend to VPS (Cleaning first)...'
ssh ${VPS_USER}@${VPS_IP} "rm -rf ${REMOTE_DIR}/dist/*"
scp -r ./dist/* ${VPS_USER}@${VPS_IP}:${REMOTE_DIR}/dist/
ssh ${VPS_USER}@${VPS_IP} "ls -l ${REMOTE_DIR}/dist/index.html"

echo '[2/3] Copying Backend Files to VPS...'
scp ./server/server.js ./server/package.json ${VPS_USER}@${VPS_IP}:${REMOTE_DIR}/server/

echo '[3/3] Restarting PM2 Backend Server...'
ssh ${VPS_USER}@${VPS_IP} "cd ${REMOTE_DIR}/server && npm install && pm2 restart aipcore-backend"

Write-Host "✅ All done! Fast update complete." -ForegroundColor Green
