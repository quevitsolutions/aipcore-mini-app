$workingDir = "f:\AIPCORE MINI APP"
$extractPath = "$workingDir\pg"
$dbPath = "$extractPath\data"
$binPath = "$extractPath\pgsql\bin"
$port = 5434

Write-Output "Extracting PostgreSQL binaries..."
If (!(Test-Path "$extractPath\pgsql")) {
    tar.exe -xf "$workingDir\postgresql.zip" -C "$workingDir"
    
    Write-Output "Moving pgsql to pg..."
    If (!(Test-Path $extractPath)) {
        New-Item -ItemType Directory -Path $extractPath
    }
    If (Test-Path "$workingDir\pgsql") {
        Move-Item "$workingDir\pgsql" "$extractPath" -Force
    }
} Else {
    Write-Output "PostgreSQL binaries already present."
}

# Add a check in case it extracted directly to pg\pgsql 
If (!(Test-Path $binPath) -and (Test-Path "$extractPath\bin")) {
    $binPath = "$extractPath\bin"
}

Write-Output "Initializing Database Cluster..."
If (!(Test-Path "$dbPath\PG_VERSION")) {
    & "$binPath\initdb.exe" -D $dbPath -E UTF8 --pwfile="$workingDir\pgpass.txt" -U postgres
} Else {
    Write-Output "Database cluster already initialized."
}

Write-Output "Starting Database Server..."
$portCheck = netstat -ano | findstr ":$port"
If ($portCheck) {
    Write-Output "Database server already running on port $port."
} Else {
    & "$binPath\pg_ctl.exe" -D $dbPath -w -l "$extractPath\pg.log" -o "-p $port" start
    If ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to start database server. Check $extractPath\pg.log for details."
        Write-Output "NOTE: If you see Error 1455, please increase your Windows Paging File size."
        exit $LASTEXITCODE
    }
}

Write-Output "Configuring Users and Databases..."
$env:PGPASSWORD = "postgres"

# Check if user exists
$userExists = & "$binPath\psql.exe" -U postgres -p $port -tAc "SELECT 1 FROM pg_roles WHERE rolname='aip_admin'"
If ($userExists -ne "1") {
    & "$binPath\psql.exe" -U postgres -p $port -c "CREATE USER aip_admin WITH SUPERUSER PASSWORD 'aip_password_123';"
} Else {
    Write-Output "User aip_admin already exists."
}

# Check if database exists
$dbExists = & "$binPath\psql.exe" -U postgres -p $port -tAc "SELECT 1 FROM pg_database WHERE datname='aipcore_db'"
If ($dbExists -ne "1") {
    & "$binPath\psql.exe" -U postgres -p $port -c "CREATE DATABASE aipcore_db OWNER aip_admin;"
} Else {
    Write-Output "Database aipcore_db already exists."
}

Write-Output "Setup Complete."
