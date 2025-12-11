# Script to start PromptyFlow in Docker on Windows
# Prerequisite: .env file is already filled

Write-Host "Starting PromptyFlow in Docker..." -ForegroundColor Cyan
Write-Host ""

# Check Docker
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not found"
    }
    Write-Host "[OK] Docker installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker is not installed or not running!" -ForegroundColor Red
    Write-Host "   Install Docker Desktop and make sure it's running." -ForegroundColor Yellow
    Write-Host "   Download: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

# Check Docker Compose
Write-Host "Checking Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker-compose --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Compose not found"
    }
    Write-Host "[OK] Docker Compose installed: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker Compose not found!" -ForegroundColor Red
    exit 1
}

# Check if Docker Desktop is running
Write-Host "Checking Docker Desktop status..." -ForegroundColor Yellow
try {
    $null = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not running"
    }
    Write-Host "[OK] Docker Desktop is running" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker Desktop is not running!" -ForegroundColor Red
    Write-Host "   Start Docker Desktop and wait for it to fully load." -ForegroundColor Yellow
    exit 1
}

# Check .env file
Write-Host "Checking .env file..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "[ERROR] .env file not found!" -ForegroundColor Red
    Write-Host "   Create .env file in project root and fill it." -ForegroundColor Yellow
    Write-Host "   See documentation: docs/DOCKER_DEPLOYMENT.md" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] .env file found" -ForegroundColor Green

# Check docker-compose.yml
Write-Host "Checking docker-compose.yml..." -ForegroundColor Yellow
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "[ERROR] docker-compose.yml file not found!" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] docker-compose.yml file found" -ForegroundColor Green

Write-Host ""
Write-Host "[OK] All checks passed!" -ForegroundColor Green
Write-Host ""

# Stop existing containers (if any)
Write-Host "Stopping existing containers (if any)..." -ForegroundColor Yellow
$null = docker-compose down 2>&1

Write-Host ""
Write-Host "Building and starting containers..." -ForegroundColor Cyan
Write-Host "   This may take several minutes on first run..." -ForegroundColor Gray
Write-Host ""

# Build and start containers
try {
    docker-compose up -d --build
    
    if ($LASTEXITCODE -ne 0) {
        throw "Error starting containers"
    }
    
    Write-Host ""
    Write-Host "[OK] Containers started!" -ForegroundColor Green
    Write-Host ""
    
    # Wait for containers to start
    Write-Host "Waiting for services to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # Check container status
    Write-Host ""
    Write-Host "Container status:" -ForegroundColor Cyan
    docker-compose ps
    
    Write-Host ""
    Write-Host "Application is available at:" -ForegroundColor Green
    Write-Host "   - Backend API:  http://localhost:3000" -ForegroundColor White
    Write-Host "   - Frontend:     http://localhost:5173" -ForegroundColor White
    Write-Host "   - Health Check: http://localhost:3000/health" -ForegroundColor White
    Write-Host ""
    
    # Check health endpoint
    Write-Host "Checking API..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    $maxRetries = 5
    $retryCount = 0
    $apiReady = $false
    
    while ($retryCount -lt $maxRetries -and -not $apiReady) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "[OK] API is working correctly!" -ForegroundColor Green
                $apiReady = $true
            }
        } catch {
            $retryCount++
            if ($retryCount -lt $maxRetries) {
                Write-Host "   Attempt $retryCount of $maxRetries..." -ForegroundColor Gray
                Start-Sleep -Seconds 3
            } else {
                Write-Host "[WARNING] API is not ready yet, wait a few seconds..." -ForegroundColor Yellow
                Write-Host "   Check logs: docker-compose logs api" -ForegroundColor Gray
            }
        }
    }
    
    Write-Host ""
    Write-Host "Useful commands:" -ForegroundColor Cyan
    Write-Host "   View logs:              docker-compose logs -f" -ForegroundColor Gray
    Write-Host "   API logs:               docker-compose logs -f api" -ForegroundColor Gray
    Write-Host "   Frontend logs:          docker-compose logs -f web" -ForegroundColor Gray
    Write-Host "   Stop:                   docker-compose stop" -ForegroundColor Gray
    Write-Host "   Stop and remove:        docker-compose down" -ForegroundColor Gray
    Write-Host "   Status:                 docker-compose ps" -ForegroundColor Gray
    Write-Host ""
    Write-Host "[SUCCESS] Done! Application is running in Docker." -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "[ERROR] Error starting containers!" -ForegroundColor Red
    Write-Host "   Check logs: docker-compose logs" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Error details:" -ForegroundColor Yellow
    if ($_.Exception.Message) {
        Write-Host $_.Exception.Message -ForegroundColor Red
    } else {
        Write-Host "Unknown error. Check Docker logs." -ForegroundColor Red
    }
    exit 1
}
