# CARVIPIX Design System v1.0
## Componentes y Tokens Disponibles

**Status:** ✅ Design System base creado y compilado exitosamente

---

## ESTRUCTURA

```
app/design-system/
├── tokens.ts              # Colores, spacing, tipografía, animaciones
├── components/
│   ├── Button.tsx        # CARVIPIXButton (3 variantes)
│   ├── Card.tsx          # CARVIPIXCard (contenedor)
│   └── StatCard.tsx      # CARVIPIXStatCard (estadísticas)
└── index.ts              # Exports
```

---

## TOKENS DISPONIBLES

### Colores (3 únicos)
```typescript
import { colors } from '@/design-system/tokens';

colors.black.pure      // #000000
colors.black.dark      // #05070B
colors.black.darker    // #0B111A

colors.gold.primary    // #D4AF37
colors.gold.bright     // #E6C547
colors.gold.muted      // #B8960F

colors.white.pure      // #FFFFFF
colors.white.text      // #C0C0C0
colors.white.secondary // #808080

// Semántico
colors.success         // #22C55E
colors.warning         // #F59E0B
colors.error           // #EF4444
```

### Spacing (Grid 8px)
```typescript
import { spacing } from '@/design-system/tokens';

spacing[4]   // 4px
spacing[8]   // 8px
spacing[16]  // 16px
spacing[32]  // 32px
spacing[64]  // 64px
spacing[128] // 128px
```

### Tipografía
```typescript
import { typography } from '@/design-system/tokens';

typography.fonts.sans    // Inter
typography.fonts.mono    // JetBrains Mono

typography.sizes.xs      // 12px
typography.sizes.base    // 14px
typography.sizes['3xl']  // 32px

typography.weights.regular    // 400
typography.weights.semibold   // 600
typography.weights.bold       // 700
```

### Animaciones
```typescript
import { animations } from '@/design-system/tokens';

animations.durations.fast    // 200ms
animations.durations.medium  // 600ms
animations.durations.slow    // 1000ms

animations.easing.responsive // Bounce
animations.easing.smooth     // Cubic
animations.easing.organic    // Ease-out
```

### Sombras
```typescript
import { shadows } from '@/design-system/tokens';

shadows.subtle   // Panel sutil
shadows.glow.sm  // Glow pequeño
shadows.glow.md  // Glow medio
shadows.glow.lg  // Glow grande
shadows.hover    // Elevación en hover
```

---

## COMPONENTES

### CARVIPIXButton

Botones unificados con 3 variantes.

**Variantes:**
- `primary` - Dorado, principal CTA
- `secondary` - Border dorado, secundario
- `ghost` - Transparente, mínimo
- `danger` - Rojo, acciones destructivas

**Tamaños:**
- `sm` - 32px
- `md` - 40px (default)
- `lg` - 48px

**Uso:**
```typescript
import { CARVIPIXButton } from '@/design-system';
import { Plus } from 'lucide-react';

<CARVIPIXButton 
  variant="primary" 
  size="lg"
  leftIcon={<Plus size={20} />}
>
  Agregar
</CARVIPIXButton>

<CARVIPIXButton variant="secondary" disabled>
  Deshabilitado
</CARVIPIXButton>

<CARVIPIXButton isLoading>
  Cargando...
</CARVIPIXButton>
```

**Props:**
```typescript
{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  disabled?: boolean
  // ... todos los atributos HTMLButtonElement
}
```

---

### CARVIPIXCard

Contenedor general para cualquier contenido.

**Variantes:**
- `default` - Border dorado sutil
- `elevated` - Border dorado más visible
- `outlined` - Border blanco sutil

**Uso:**
```typescript
import { CARVIPIXCard } from '@/design-system';

<CARVIPIXCard variant="default" padding="32">
  <h3>Contenido</h3>
  <p>Este es un panel CARVIPIX</p>
</CARVIPIXCard>

<CARVIPIXCard variant="elevated" hover padding="16">
  Panel elevado con efecto hover
</CARVIPIXCard>
```

**Props:**
```typescript
{
  variant?: 'default' | 'elevated' | 'outlined'
  hover?: boolean  // Efecto elevación en hover
  padding?: '4' | '8' | '16' | '24' | '32' | '40' | '64' | '128'
  // ... todos los atributos HTMLDivElement
}
```

---

### CARVIPIXStatCard

Card especializada para mostrar estadísticas (número + contexto).

**Características:**
- Animación de entrada (fade + slide)
- Animación de número (CountUp)
- Icon opcional
- Descripción y trend

**Uso:**
```typescript
import { CARVIPIXStatCard } from '@/design-system';
import { Wallet } from 'lucide-react';

<CARVIPIXStatCard
  label="Balance"
  value={8742.50}
  prefix="$"
  suffix=" USD"
  description="Equity actual"
  trend="+3.2%"
  icon={Wallet}
  color="gold"
/>

<CARVIPIXStatCard
  label="Win Rate"
  value={69.5}
  suffix="%"
  description="89 operaciones ganadoras"
  trend="+1.8%"
  color="success"
/>
```

**Props:**
```typescript
{
  label: string
  value: number
  prefix?: string           // Ej: "$"
  suffix?: string           // Ej: " USD" o "%"
  trend?: string            // Ej: "+3.2%" o "-1.5%"
  description?: string
  icon?: React.ComponentType
  color?: 'gold' | 'white' | 'success'
}
```

---

## CÓMO USAR EN PÁGINAS

**Paso 1: Importar**
```typescript
import { 
  CARVIPIXButton,
  CARVIPIXCard,
  CARVIPIXStatCard,
  colors,
  spacing,
  typography,
} from '@/design-system';
```

**Paso 2: Usar componentes**
```typescript
export default function MyPage() {
  return (
    <main style={{ backgroundColor: colors.black.dark }}>
      <CARVIPIXCard variant="elevated">
        <h2 style={{ color: colors.gold.primary }}>Título</h2>
        <p style={{ color: colors.white.pure }}>Contenido</p>
        
        <CARVIPIXButton variant="primary" fullWidth>
          Acción Principal
        </CARVIPIXButton>
      </CARVIPIXCard>
    </main>
  );
}
```

---

## REGLAS DEL DESIGN SYSTEM

### ✅ HACED:
- Usa `colors`, `spacing`, `typography` para TODO
- Reutiliza componentes en lugar de duplicar
- Mantén consistencia visual entre páginas
- Usa Grid 8px para espaciados
- Imports desde `@/design-system`

### ❌ NO HAGAS:
- Colores hardcodeados (usar `colors.*`)
- Espaciados aleatorios (usar `spacing[8]`, etc.)
- Componentes duplicados (reutiliza)
- Inline styles complejos (crear componente)
- Fuentes distintas a Inter/JetBrains Mono

---

## PRÓXIMOS COMPONENTES A CREAR

```
[ ] CARVIPIXTable       - Tablas unificadas
[ ] CARVIPIXInput       - Inputs unificados
[ ] CARVIPIXBadge       - Badges de status
[ ] CARVIPIXHeader      - Encabezados de sección
[ ] CARVIPIXEmpty       - Estado vacío
[ ] CARVIPIXError       - Estado error
[ ] CARVIPIXLoading     - Estados de carga
[ ] CARVIPIXModal       - Modales
[ ] CARVIPIXTooltip     - Tooltips
[ ] CARVIPIXDropdown    - Dropdowns
```

---

## APLICACIÓN A PÁGINAS

**Orden de aplicación:**
1. ✅ Design System base (tokens + componentes iniciales)
2. → **HOME** (comenzar aquí)
3. → Dashboard Cliente
4. → Alertas
5. → Resultados
6. → Análisis
7. → Comunidad
8. → Herramientas
9. → Perfil
10. → Soporte

---

## COMPILACIÓN

```bash
npm run build    # Compilación de producción
npm run dev      # Desarrollo
```

**Status:** ✅ Compilado exitosamente (3.7s)

---

## VERSIÓN CONTROL

```
v1.0 - 2026-07-03
- Tokens definidos (colores, spacing, tipografía, animaciones)
- CARVIPIXButton (primary, secondary, ghost, danger)
- CARVIPIXCard (default, elevated, outlined)
- CARVIPIXStatCard (con animaciones)
- globals.css actualizado con CARVIPIX theme
- Build: ✅ Exitoso
- TypeScript: ✅ Pasó validación
```

---

## SIGUIENTE PASO

Aplicar Design System al **HOME** usando todos estos componentes y tokens.

El Home será el **referencia visual** para todas las otras páginas.
