import subprocess
import time
from PIL import ImageGrab
from datetime import datetime

# Captura 1: Estado actual
print("Captura 1: Estado actual de MT5...")
img = ImageGrab.grab()
img.save("C:/Users/user1/carvipix/EVIDENCE_01_INITIAL.png")
print("✅ Guardado: EVIDENCE_01_INITIAL.png")

# Esperar
time.sleep(1)

# Captura 2: Después de esperar
print("Captura 2: Después de 1 segundo...")
img = ImageGrab.grab()
img.save("C:/Users/user1/carvipix/EVIDENCE_02_WAIT.png")
print("✅ Guardado: EVIDENCE_02_WAIT.png")

print("Capturas completadas")
