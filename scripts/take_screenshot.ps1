# Screenshot de MT5 - Validación de instalación del EA
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$screen = [System.Windows.Forms.Screen]::PrimaryScreen
$bitmap = New-Object System.Drawing.Bitmap($screen.Bounds.Width, $screen.Bounds.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($screen.Bounds.Location, [System.Drawing.Point]::Empty, $screen.Bounds.Size)
$bitmap.Save("C:\Users\user1\carvipix\screenshots\MT5_EA_INSTALLATION_01_NAVIGATOR.png")
$graphics.Dispose()
$bitmap.Dispose()

Write-Output "✅ Screenshot guardado: MT5_EA_INSTALLATION_01_NAVIGATOR.png"
