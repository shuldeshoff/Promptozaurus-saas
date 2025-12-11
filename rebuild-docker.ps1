# Script to rebuild PromptyFlow Docker platform after code changes
# Rebuilds containers without removing volumes (preserves database data)

param(
    [string]$Service = "",
    [switch]$NoCache = $false,
    [switch]$Force = $false
)

Write-Host ""
Write-Host "=== PromptyFlow Docker Platform Rebuild ===" -ForegroundColor Cyan
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

# Check docker-compose.yml
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "[ERROR] docker-compose.yml file not found!" -ForegroundColor Red
    Write-Host "   Are you in the project root directory?" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Checking running containers..." -ForegroundColor Yellow

# Get running containers
$runningContainers = docker-compose ps --services --filter "status=running" 2>&1
if ($LASTEXITCODE -eq 0 -and $runningContainers) {
    Write-Host "[INFO] Found running containers:" -ForegroundColor Cyan
    docker-compose ps
    Write-Host ""
} else {
    Write-Host "[INFO] No running containers found. Starting fresh build..." -ForegroundColor Gray
    Write-Host ""
}

# Determine rebuild strategy
$rebuildCommand = "docker-compose up -d --build"
if ($NoCache) {
    $rebuildCommand = "docker-compose build --no-cache && docker-compose up -d"
    Write-Host "[INFO] Full rebuild with --no-cache (slower but cleaner)" -ForegroundColor Yellow
}

if ($Service) {
    Write-Host "[INFO] Rebuilding only service: $Service" -ForegroundColor Cyan
    if ($NoCache) {
        $rebuildCommand = "docker-compose build --no-cache $Service && docker-compose up -d $Service"
    } else {
        $rebuildCommand = "docker-compose up -d --build $Service"
    }
}

Write-Host ""

# Rebuild and start
# Note: docker-compose up -d --build automatically stops old containers and starts new ones
Write-Host "Rebuilding and starting containers..." -ForegroundColor Cyan
if ($NoCache) {
    Write-Host "   This may take 5-10 minutes (full rebuild)..." -ForegroundColor Gray
} else {
    Write-Host "   This may take 2-5 minutes..." -ForegroundColor Gray
}
Write-Host ""

try {
    if ($NoCache) {
        # Split command for --no-cache
        if ($Service) {
            Write-Host "   Building $Service with --no-cache..." -ForegroundColor Gray
            docker-compose build --no-cache $Service
            if ($LASTEXITCODE -ne 0) {
                throw "Error building $Service"
            }
            Write-Host "   Starting $Service..." -ForegroundColor Gray
            docker-compose up -d $Service
        } else {
            Write-Host "   Building all services with --no-cache..." -ForegroundColor Gray
            docker-compose build --no-cache
            if ($LASTEXITCODE -ne 0) {
                throw "Error building containers"
            }
            Write-Host "   Starting all services..." -ForegroundColor Gray
            docker-compose up -d
        }
    } else {
        # Standard rebuild
        if ($Service) {
            docker-compose up -d --build $Service
        } else {
            docker-compose up -d --build
        }
    }
    
    if ($LASTEXITCODE -ne 0) {
        throw "Error rebuilding containers"
    }
    
    Write-Host ""
    Write-Host "[OK] Containers rebuilt and started!" -ForegroundColor Green
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
    Write-Host "   - Backend API:  http://localhost:3001" -ForegroundColor White
    Write-Host "   - Frontend:     http://localhost:5173" -ForegroundColor White
    Write-Host "   - Health Check: http://localhost:3001/health" -ForegroundColor White
    Write-Host ""
    
    # Check health endpoint
    Write-Host "Checking API..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    $maxRetries = 5
    $retryCount = 0
    $apiReady = $false
    
    while ($retryCount -lt $maxRetries -and -not $apiReady) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
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
    Write-Host "   Rebuild specific:       .\rebuild-docker.ps1 -Service api" -ForegroundColor Gray
    Write-Host "   Full rebuild:           .\rebuild-docker.ps1 -NoCache" -ForegroundColor Gray
    Write-Host "   Stop:                   .\stop-docker.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "[SUCCESS] Rebuild complete! Application is running." -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "[ERROR] Error rebuilding containers!" -ForegroundColor Red
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

Write-Host ""

