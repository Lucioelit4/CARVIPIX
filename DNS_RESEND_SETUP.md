# CONFIGURACIÓN DNS PARA RESEND

## Registros requeridos para verificar carvipix.com en Resend

Los siguientes registros DNS deben agregarse a tu proveedor de DNS:

### 1. SPF Record (Sender Policy Framework)
**Tipo:** TXT  
**Nombre (Host):** carvipix.com  
**Valor:**
```
v=spf1 include:resend.com ~all
```

### 2. DKIM Record (DomainKeys Identified Mail)
**Tipo:** CNAME  
**Nombre (Host):** default._domainkey.carvipix.com  
**Valor:** (lo proporciona Resend en la consola, similar a)
```
default._domainkey.carvipix.com.cname.resend.com
```

### 3. DMARC Record (Domain-based Message Authentication)
**Tipo:** TXT  
**Nombre (Host):** _dmarc.carvipix.com  
**Valor:**
```
v=DMARC1; p=none; rua=mailto:admin@carvipix.com
```

---

## Pasos para configurar en tu proveedor DNS

1. Accede a tu panel de control del dominio (GoDaddy, Namecheap, CloudFlare, etc.)
2. Busca la sección de "DNS Records" o "Gestionar DNS"
3. Agrega los 3 registros anteriores
4. Espera 24-48 horas para que se propague
5. Vuelve a Resend y haz clic en "Verificar dominio"

---

## Estado actual

- **Dominio:** carvipix.com
- **API Key:** Configurada en .env.local
- **Email principal:** noreply@carvipix.com
- **Status:** Pendiente verificación (requiere registros DNS)

---

## Verificación manual

Después de agregar los registros, puedes verificar con estos comandos:

```bash
# Verificar SPF
nslookup -type=TXT carvipix.com

# Verificar DKIM
nslookup -type=CNAME default._domainkey.carvipix.com

# Verificar DMARC
nslookup -type=TXT _dmarc.carvipix.com
```
