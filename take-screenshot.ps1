# Crear directorio si no existe
if (-not (Test-Path 'c:\Users\user1\carvipix\screenshots')) {
    New-Item -ItemType Directory -Path 'c:\Users\user1\carvipix\screenshots' -Force
}

# Tomar screenshot
Add-Type -AssemblyName System.Windows.Forms
$screen = [System.Windows.Forms.Screen]::PrimaryScreen
$bitmap = New-Object System.Drawing.Bitmap($screen.Bounds.Width, $screen.Bounds.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($screen.Bounds.Location, [System.Drawing.Point]::Empty, $screen.Bounds.Size)
$bitmap.Save('c:\Users\user1\carvipix\screenshots\home-nuevo.png')
Write-Host "Screenshot guardado en: c:\Users\user1\carvipix\screenshots\home-nuevo.png"
