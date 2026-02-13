Add-Type -AssemblyName System.Drawing

$baseDir = $PSScriptRoot
$linksDir = Join-Path $baseDir "links"
$thumbsDir = Join-Path $baseDir "thumbs"

$targetWidth = 600
$quality = 70

# JPEG encoder
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$quality)

$files = Get-ChildItem -Path $linksDir -Recurse -Include *.jpg,*.jpeg,*.png | Where-Object { $_.Name -ne 'Thumbs.db' }

$total = $files.Count
$count = 0

foreach ($file in $files) {
    $count++
    $relativePath = $file.FullName.Substring($linksDir.Length)
    $thumbPath = Join-Path $thumbsDir $relativePath
    $thumbFolder = Split-Path $thumbPath -Parent

    if (-not (Test-Path $thumbFolder)) {
        New-Item -ItemType Directory -Path $thumbFolder -Force | Out-Null
    }

    if (Test-Path $thumbPath) {
        Write-Host "[$count/$total] SKIP (exists): $relativePath"
        continue
    }

    try {
        $image = [System.Drawing.Image]::FromFile($file.FullName)
        
        $ratio = $targetWidth / $image.Width
        $newHeight = [int]($image.Height * $ratio)

        $thumb = New-Object System.Drawing.Bitmap($targetWidth, $newHeight)
        $graphics = [System.Drawing.Graphics]::FromImage($thumb)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.DrawImage($image, 0, 0, $targetWidth, $newHeight)

        $thumb.Save($thumbPath, $jpegCodec, $encoderParams)

        $origKB = [math]::Round($file.Length / 1024)
        $thumbKB = [math]::Round((Get-Item $thumbPath).Length / 1024)
        Write-Host "[$count/$total] OK: $relativePath ($origKB KB -> $thumbKB KB)"

        $graphics.Dispose()
        $thumb.Dispose()
        $image.Dispose()
    }
    catch {
        Write-Host "[$count/$total] ERROR: $relativePath - $_"
    }
}

Write-Host "`nDone! $count thumbnails processed."
