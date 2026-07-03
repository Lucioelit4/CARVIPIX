# 🎯 SISTEMA DE 3 CHATS ESPECIALIZADOS — CARVIPIX

## Cómo Usar

Este sistema te permite trabajar con **3 roles especializados en paralelo**:

### **1️⃣ DIRECTOR DE PRODUCTO** 🎯
**Archivo:** `CHAT_1_DIRECTOR_PRODUCTO.md`

**Úsalo cuando:**
- Necesites tomar decisiones estratégicas
- Quieras criticar la UX actual
- Necesites definir nuevas funcionalidades
- Quieras priorizar qué hacer primero

**No hace:** Código, diseño visual, implementación

---

### **2️⃣ FRONTEND LEAD** 💻
**Archivo:** `CHAT_2_FRONTEND_LEAD.md`

**Úsalo cuando:**
- Necesites implementar una decisión del Director
- Quieras construir componentes React
- Necesites optimizar UI/UX
- Quieras animar algo o mejorar responsive

**No hace:** Decisiones estratégicas, cambios en APIs, lógica backend

---

### **3️⃣ BACKEND / MOTOR** ⚙️
**Archivo:** `CHAT_3_BACKEND_MOTOR.md`

**Úsalo cuando:**
- Necesites construir una API
- Quieras desarrollar el motor de trading
- Necesites implementar autenticación, pagos, alertas
- Quieras conectar base de datos

**No hace:** Cambios de UI, decisiones de UX, diseño visual

---

## 🔄 Flujo de Trabajo

```
1. Director (CHAT_1) 
   ↓ Decide qué hacer
   
2. Frontend (CHAT_2) 
   ↓ Implementa la interfaz
   
3. Backend (CHAT_3) 
   ↓ Implementa la lógica
   
Resultado: Cambio completamente implementado
```

---

## 📋 Cómo Cambiar de Rol

**Opción A: Mencionar el archivo**
```
@director [pregunta/decisión]
@frontend [implementación]
@backend [lógica]
```

**Opción B: Copiar/Pegar el contexto**
1. Abre `CHAT_1_DIRECTOR_PRODUCTO.md`
2. Copia el contenido
3. Pégalo en el prompt inicial de un nuevo chat

**Opción C: Crear 3 instancias de VS Code**
1. Abre VS Code 3 veces
2. Cada una con un role diferente
3. Trabaja en paralelo

---

## ✅ Reglas Universales

- **Director SIEMPRE decide primero**
- **Frontend implementa exactamente lo aprobado**
- **Backend NO cambia UX, solo proporciona datos**
- **Si hay conflicto, Director tiene la última palabra**

---

## 🚀 Comienza Aquí

1. Lee `CHAT_1_DIRECTOR_PRODUCTO.md`
2. Propón una decisión estratégica
3. Cuando esté aprobado, pasa a Frontend/Backend
4. Implementa
5. Repite

---

**Documentos creados:** 2026-07-03
