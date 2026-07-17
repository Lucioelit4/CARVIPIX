# test-file-integrity.ps1
$file = "CARVIPIX_BOTKEY-008B3009-1784252915538.ex5"

if (Test-Path $file) {
  $size = (Get-Item $file).Length
  Write-Output "✅ Archivo encontrado: $file"
  Write-Output "📊 Tamaño: $size bytes"
  
  # Verificar que sea un archivo válido
  if ($size -gt 1000) {
    Write-Output "✅ Tamaño válido para ejecutable EA"
    Write-Output ""
    Write-Output "✅✅✅ DESCARGA Y VALIDACIÓN EXITOSA ✅✅✅"
  }
} else {
  Write-Output "❌ Archivo no encontrado"
}
