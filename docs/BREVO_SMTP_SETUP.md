# CARVIPIX - Configuracion SMTP con Brevo (Transaccional)

Este documento deja listo el envio real de correo transaccional de bienvenida para registro.
No incluye campañas masivas.

## 1) Variables exactas para .env.local

Configura estas variables en `.env.local`:

```env
# Activar transporte SMTP real
EMAIL_TRANSPORT=smtp

# URL publica para links de verificacion
APP_PUBLIC_URL=https://carvipix.com

# Identidad de marca
EMAIL_FROM_NAME=CARVIPIX

# Remitentes empresariales
EMAIL_NOREPLY_ADDRESS=noreply@carvipix.com
EMAIL_SUPPORT_ADDRESS=soporte@carvipix.com
EMAIL_PAYMENTS_ADDRESS=pagos@carvipix.com

# Brevo SMTP (ejemplo seguro, sin claves reales)
EMAIL_SMTP_HOST=smtp-relay.brevo.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=TU_USUARIO_SMTP_BREVO
EMAIL_SMTP_PASSWORD=TU_PASSWORD_SMTP_BREVO
```

Notas:
- No subas `.env.local` al repositorio.
- Nunca uses claves reales en `.env.example`, documentacion o codigo fuente.

## 2) Registros DNS requeridos para carvipix.com

Configura DNS en tu proveedor de dominio segun los valores que te entregue Brevo para tu cuenta.
Los host exactos DKIM pueden variar por tenant; usa siempre los que muestra Brevo en su panel.

### SPF (TXT)

```txt
Tipo: TXT
Host/Nombre: @
Valor: v=spf1 include:spf.sendinblue.com ~all
```

Si ya existe SPF en el dominio, unifica en un solo registro SPF.

### DKIM (TXT)

Brevo normalmente solicita varios registros DKIM/CNAME para firma de dominio.
Ejemplo de formato (referencial):

```txt
Tipo: CNAME o TXT (segun panel Brevo)
Host/Nombre: mail._domainkey
Valor: valor-indicado-por-brevo
```

```txt
Tipo: CNAME o TXT (segun panel Brevo)
Host/Nombre: mail2._domainkey
Valor: valor-indicado-por-brevo
```

### DMARC (TXT)

Inicio recomendado (monitoreo):

```txt
Tipo: TXT
Host/Nombre: _dmarc
Valor: v=DMARC1; p=none; rua=mailto:dmarc@carvipix.com; adkim=s; aspf=s; pct=100
```

Luego de validar entregabilidad y alineacion SPF/DKIM, endurecer politica a `p=quarantine` o `p=reject`.

## 3) Confirmacion de comportamiento en CARVIPIX

Con SMTP correctamente configurado:
- El flujo de registro se mantiene igual.
- El correo de bienvenida se envia automaticamente.
- El remitente sale desde `noreply@carvipix.com` (rol `noreply`).
- No se habilitan campanas masivas con esta configuracion.

## 4) Checklist rapido de salida a produccion

1. Validar dominio en Brevo y completar autenticaciones DNS.
2. Esperar propagacion DNS y verificar estado en Brevo.
3. Configurar `.env.local`/secrets de entorno con credenciales SMTP reales.
4. Crear una cuenta de prueba en registro y confirmar entrega en inbox.
5. Revisar spam score y cabeceras SPF/DKIM/DMARC del mensaje recibido.
