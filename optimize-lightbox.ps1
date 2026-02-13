# Portfolio Minimalista — Original Image Optimizer for Lightbox
# Resizes images to 1600px width for fast web loading while maintaining high quality.

# ── CONFIGURATION ──────────────────────────────────────────────
$SourceDir = "$PSScriptRoot/links"     # Current heavy images
$TargetDir = "$PSScriptRoot/optimized" # Web-optimized versions
$TargetWidth = 1600
$JpegQuality = 80

# Load System.Drawing for image manipulation
Add-Type -AssemblyName System.Drawing

# ── HELPER: Resize Function ────────────────────────────────────
function Resize-Image {
    param($srcPath, $destPath, $newWidth)
    
    try {
        $img = [System.Drawing.Image]::FromFile($srcPath)
        
        # Calculate height maintaining aspect ratio
        $ratio = $newWidth / $img.Width
        $newHeight = [int]($img.Height * $ratio)
        
        # Create new bitmap
        $bmp = new-object System.Drawing.Bitmap($newWidth, $newHeight)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        
        # High quality scaling
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        
        $g.DrawImage($img, 0, 0, $newWidth, $newHeight)
        
        # Setup JPEG Compression
        $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
        $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
        $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, $JpegQuality)
        
        $bmp.Save($destPath, $encoder, $encoderParams)
        
        # Cleanup
        $g.Dispose()
        $bmp.Dispose()
        $img.Dispose()
        return $true
    }
    catch {
        Write-Host "Error processing $srcPath : $_" -ForegroundColor Red
        return $false
    }
}

# ── MAIN EXECUTION ─────────────────────────────────────────────
$SourceDir = (Get-Item $SourceDir).FullName
$TargetDir = if (Test-Path $TargetDir) { (Get-Item $TargetDir).FullName } else { New-Item -ItemType Directory -Path $TargetDir | % { $_.FullName } }

$files = Get-ChildItem -Path $SourceDir -Recurse -Include *.jpg, *.jpeg, *.png

Write-Host "--- Starting Lightbox Optimization (Target: $TargetWidth px) ---" -ForegroundColor Cyan
Write-Host "Source: $SourceDir"
Write-Host "Target: $TargetDir"
Write-Host "Total images found: $($files.Count)"

$count = 0
foreach ($file in $files) {
    # Calculate relative path safely
    $relative = $file.FullName.Substring($SourceDir.Length).TrimStart("\").TrimStart("/")
    $destFile = Join-Path $TargetDir $relative
    $destSubDir = Split-Path $destFile
    
    if (!(Test-Path $destSubDir)) { New-Item -ItemType Directory -Path $destSubDir -Force }

    if (Test-Path $destFile) {
        Write-Host "Skipping $relative (already exists)" -ForegroundColor Gray
        continue
    }

    Write-Host "Optimizing: $relative..." -NoNewline
    if (Resize-Image $file.FullName $destFile $TargetWidth) {
        Write-Host " Done." -ForegroundColor Green
        $count++
    }
}

Write-Host "--- Finished! Optimized $count images. ---" -ForegroundColor Cyan
