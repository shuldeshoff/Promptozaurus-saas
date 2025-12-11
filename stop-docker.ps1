# Script to stop PromptyFlow Docker platform on Windows
# Stops all containers and optionally removes volumes and resources

param(
    [switch]$RemoveVolumes = $false,
    [switch]$Cleanup = $false,
    [switch]$Force = $false
)

Write-Host ""
Write-Host "=== PromptyFlow Docker Platform Shutdown ===" -ForegroundColor Cyan
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
    Write-Host "[WARNING] Docker is not installed or not running!" -ForegroundColor Yellow
    Write-Host "   Nothing to stop." -ForegroundColor Gray
    exit 0
}

# Check Docker Desktop is running
Write-Host "Checking Docker Desktop status..." -ForegroundColor Yellow
try {
    $null = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not running"
    }
    Write-Host "[OK] Docker Desktop is running" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Docker Desktop is not running!" -ForegroundColor Yellow
    Write-Host "   Nothing to stop." -ForegroundColor Gray
    exit 0
}

# Check docker-compose.yml
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "[WARNING] docker-compose.yml file not found!" -ForegroundColor Yellow
    Write-Host "   Are you in the project root directory?" -ForegroundColor Gray
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
    Write-Host "[INFO] No running containers found." -ForegroundColor Gray
    Write-Host ""
}

# Confirm removal of volumes if requested
if ($RemoveVolumes -and -not $Force) {
    Write-Host "[WARNING] This will remove all volumes and delete all data!" -ForegroundColor Red
    Write-Host "   This action cannot be undone!" -ForegroundColor Red
    Write-Host ""
    $confirm = Read-Host "Are you sure you want to continue? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "[INFO] Operation cancelled." -ForegroundColor Yellow
        exit 0
    }
    Write-Host ""
}

# Stop containers
Write-Host "Stopping containers..." -ForegroundColor Yellow
try {
    if ($RemoveVolumes) {
        Write-Host "   Removing containers and volumes..." -ForegroundColor Gray
        docker-compose down -v
    } else {
        Write-Host "   Stopping containers..." -ForegroundColor Gray
        docker-compose down
    }
    
    if ($LASTEXITCODE -ne 0) {
        throw "Error stopping containers"
    }
    
    Write-Host "[OK] Containers stopped successfully!" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host "[ERROR] Error stopping containers!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    
    # Try force stop
    Write-Host "Attempting force stop..." -ForegroundColor Yellow
    docker-compose kill 2>&1 | Out-Null
    docker-compose rm -f 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Containers force stopped!" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Some containers may still be running." -ForegroundColor Yellow
        Write-Host "   Check manually: docker-compose ps" -ForegroundColor Gray
    }
    Write-Host ""
}

# Cleanup unused resources
if ($Cleanup) {
    Write-Host "Cleaning up unused Docker resources..." -ForegroundColor Yellow
    
    if (-not $Force) {
        Write-Host "[INFO] This will remove:" -ForegroundColor Cyan
        Write-Host "   - Stopped containers" -ForegroundColor Gray
        Write-Host "   - Unused networks" -ForegroundColor Gray
        Write-Host "   - Unused images (not used by containers)" -ForegroundColor Gray
        Write-Host "   - Build cache" -ForegroundColor Gray
        Write-Host ""
        $confirm = Read-Host "Continue with cleanup? (yes/no)"
        if ($confirm -ne "yes") {
            Write-Host "[INFO] Cleanup cancelled." -ForegroundColor Yellow
            $Cleanup = $false
        }
        Write-Host ""
    }
    
    if ($Cleanup) {
        try {
            Write-Host "   Removing stopped containers..." -ForegroundColor Gray
            docker container prune -f 2>&1 | Out-Null
            
            Write-Host "   Removing unused networks..." -ForegroundColor Gray
            docker network prune -f 2>&1 | Out-Null
            
            Write-Host "   Removing unused images..." -ForegroundColor Gray
            docker image prune -f 2>&1 | Out-Null
            
            Write-Host "   Removing build cache..." -ForegroundColor Gray
            docker builder prune -f 2>&1 | Out-Null
            
            Write-Host "[OK] Cleanup completed!" -ForegroundColor Green
            Write-Host ""
        } catch {
            Write-Host "[WARNING] Some cleanup operations may have failed." -ForegroundColor Yellow
            Write-Host ""
        }
    }
}

# Final status check
Write-Host "Final status check..." -ForegroundColor Yellow
$remainingContainers = docker-compose ps 2>&1
if ($LASTEXITCODE -eq 0) {
    $containerCount = ($remainingContainers | Select-String -Pattern "^\w+" | Measure-Object).Count
    if ($containerCount -eq 0) {
        Write-Host "[OK] All containers stopped and removed!" -ForegroundColor Green
    } else {
        Write-Host "[INFO] Container status:" -ForegroundColor Cyan
        docker-compose ps
    }
} else {
    Write-Host "[OK] No containers found." -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Platform Shutdown Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "   Start platform:           .\start-docker.ps1" -ForegroundColor Gray
Write-Host "   View logs:                docker-compose logs" -ForegroundColor Gray
Write-Host "   Check status:             docker-compose ps" -ForegroundColor Gray
Write-Host "   Remove volumes:           .\stop-docker.ps1 -RemoveVolumes" -ForegroundColor Gray
Write-Host "   Full cleanup:             .\stop-docker.ps1 -Cleanup" -ForegroundColor Gray
Write-Host "   Stop with cleanup:        .\stop-docker.ps1 -RemoveVolumes -Cleanup" -ForegroundColor Gray
Write-Host ""

