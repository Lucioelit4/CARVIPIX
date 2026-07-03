"use client";

import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { CARVIPIXCard, CARVIPIXButton, colors, spacing, typography, borders } from "../../design-system";

interface AlertFiltersProps {
  categories?: string[];
  activeCategory?: string;
  status?: string;
  search?: string;
  advancedOpen?: boolean;
  session?: string;
  risk?: string;
  direction?: string;
  rrMin?: string;
  statusOptions?: string[];
  sessionOptions?: string[];
  riskOptions?: string[];
  directionOptions?: string[];
  onCategoryChange?: (value: string) => void;
  onSearchChange?: (value: string) => void;
  onStatusChange?: (value: string) => void;
  onToggleAdvanced?: () => void;
  onSessionChange?: (value: string) => void;
  onRiskChange?: (value: string) => void;
  onDirectionChange?: (value: string) => void;
  onRrMinChange?: (value: string) => void;
  onClear?: () => void;
}

export default function AlertFilters({
  categories = ["Todas", "Oro", "Forex", "Crypto"],
  activeCategory = "Todas",
  status = "Todas",
  search = "",
  advancedOpen = false,
  session = "Todas",
  risk = "Todas",
  direction = "Todas",
  rrMin = "0",
  statusOptions = ["Todas", "Activas", "TP cerca", "Cerradas"],
  sessionOptions = ["Todas", "Londres", "NY", "Asia"],
  riskOptions = ["Todas", "Bajo", "Medio", "Alto"],
  directionOptions = ["Todas", "Compra", "Venta"],
  onCategoryChange = () => {},
  onSearchChange = () => {},
  onStatusChange = () => {},
  onToggleAdvanced = () => {},
  onSessionChange = () => {},
  onRiskChange = () => {},
  onDirectionChange = () => {},
  onRrMinChange = () => {},
  onClear = () => {},
}: AlertFiltersProps) {
  const safeCategories = categories ?? ["Todas", "Oro", "Forex", "Crypto"];
  const safeStatusOptions = statusOptions ?? ["Todas", "Activas", "TP cerca", "Cerradas"];
  const safeSessionOptions = sessionOptions ?? ["Todas", "Londres", "NY", "Asia"];
  const safeRiskOptions = riskOptions ?? ["Todas", "Bajo", "Medio", "Alto"];
  const safeDirectionOptions = directionOptions ?? ["Todas", "Compra", "Venta"];

  return (
    <CARVIPIXCard variant="elevated" padding="24">
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[16], justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[12] }}>
          <p style={{ fontSize: typography.sizes.sm, textTransform: 'uppercase', letterSpacing: '0.24em', color: colors.white.secondary }}>Filtros rápidos</p>
          <h2 style={{ marginTop: spacing[12], fontSize: '1.5rem', fontWeight: typography.weights.semibold, color: colors.white.pure }}>Encuentra tu señal ideal</h2>
        </div>
        <button
          type="button"
          onClick={onToggleAdvanced}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: spacing[8],
            borderRadius: '9999px',
            border: `1px solid rgba(212, 175, 55, 0.2)`,
            backgroundColor: `rgba(212, 175, 55, 0.1)`,
            paddingLeft: spacing[16],
            paddingRight: spacing[16],
            paddingTop: spacing[12],
            paddingBottom: spacing[12],
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.semibold,
            color: colors.gold.primary,
            cursor: 'pointer',
            transition: 'all 200ms ease',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = `rgba(212, 175, 55, 0.15)`;
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = `rgba(212, 175, 55, 0.1)`;
          }}
        >
          <SlidersHorizontal size={18} />
          {advancedOpen ? "Ocultar filtros avanzados" : "Filtros avanzados"}
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[12], marginTop: spacing[24] }}>
        {safeCategories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onCategoryChange(item)}
            style={{
              borderRadius: '9999px',
              paddingLeft: spacing[16],
              paddingRight: spacing[16],
              paddingTop: spacing[8],
              paddingBottom: spacing[8],
              fontSize: typography.sizes.xs,
              fontWeight: typography.weights.semibold,
              transition: 'all 200ms ease',
              border: activeCategory === item ? 'none' : `1px solid rgba(255, 255, 255, 0.1)`,
              backgroundColor: activeCategory === item ? colors.gold.primary : `rgba(10, 15, 22, 1)`,
              color: activeCategory === item ? colors.black.pure : colors.white.secondary,
              cursor: 'pointer',
              boxShadow: activeCategory === item ? `0 0 20px rgba(212, 175, 55, 0.3)` : 'none',
            }}
            onMouseEnter={(e) => {
              if (activeCategory !== item) {
                (e.target as HTMLButtonElement).style.borderColor = `rgba(212, 175, 55, 0.4)`;
                (e.target as HTMLButtonElement).style.backgroundColor = `rgba(212, 175, 55, 0.1)`;
                (e.target as HTMLButtonElement).style.color = colors.gold.primary;
              }
            }}
            onMouseLeave={(e) => {
              if (activeCategory !== item) {
                (e.target as HTMLButtonElement).style.borderColor = `rgba(255, 255, 255, 0.1)`;
                (e.target as HTMLButtonElement).style.backgroundColor = `rgba(10, 15, 22, 1)`;
                (e.target as HTMLButtonElement).style.color = colors.white.secondary;
              }
            }}
          >
            {item}
          </button>
        ))}
      </div>

      <div style={{ marginTop: spacing[24], display: 'grid', gap: spacing[16], gridTemplateColumns: 'minmax(0, 1.7fr) auto' }}>
        <label style={{ position: 'relative', display: 'block' }}>
          <Search size={18} style={{ position: 'absolute', left: spacing[16], top: '50%', transform: 'translateY(-50%)', color: colors.white.secondary }} />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar activo..."
            style={{
              width: '100%',
              borderRadius: borders.radius.xl,
              border: `1px solid rgba(255, 255, 255, 0.1)`,
              backgroundColor: `rgba(10, 15, 22, 1)`,
              paddingTop: spacing[16],
              paddingBottom: spacing[16],
              paddingLeft: spacing[56],
              paddingRight: spacing[16],
              color: colors.white.pure,
              fontSize: typography.sizes.base,
              outline: 'none',
              transition: 'all 200ms ease',
            }}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor = colors.gold.primary;
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor = `rgba(255, 255, 255, 0.1)`;
            }}
          />
        </label>

        <div style={{ display: 'grid', gap: spacing[12], gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            style={{
              width: '100%',
              borderRadius: borders.radius.xl,
              border: `1px solid rgba(255, 255, 255, 0.1)`,
              backgroundColor: `rgba(10, 15, 22, 1)`,
              paddingLeft: spacing[12],
              paddingRight: spacing[12],
              paddingTop: spacing[12],
              paddingBottom: spacing[12],
              fontSize: typography.sizes.sm,
              color: colors.white.pure,
              outline: 'none',
              transition: 'all 200ms ease',
              cursor: 'pointer',
            }}
            onFocus={(e) => {
              (e.target as HTMLSelectElement).style.borderColor = colors.gold.primary;
            }}
            onBlur={(e) => {
              (e.target as HTMLSelectElement).style.borderColor = `rgba(255, 255, 255, 0.1)`;
            }}
          >
            {safeStatusOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onClear}
            style={{
              borderRadius: borders.radius.xl,
              border: `1px solid rgba(212, 175, 55, 0.3)`,
              backgroundColor: `rgba(212, 175, 55, 0.1)`,
              paddingLeft: spacing[16],
              paddingRight: spacing[16],
              paddingTop: spacing[12],
              paddingBottom: spacing[12],
              fontSize: typography.sizes.xs,
              fontWeight: typography.weights.semibold,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: colors.gold.primary,
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = `rgba(212, 175, 55, 0.2)`;
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = `rgba(212, 175, 55, 0.1)`;
            }}
          >
            Limpiar
          </button>
        </div>
      </div>

      {advancedOpen ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: spacing[24],
            borderRadius: borders.radius.lg,
            border: `1px solid rgba(212, 175, 55, 0.2)`,
            backgroundColor: `rgba(11, 16, 25, 0.95)`,
            padding: spacing[16],
          }}
        >
          <div style={{ display: 'grid', gap: spacing[16], gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[16], borderRadius: borders.radius.lg, border: `1px solid rgba(255, 255, 255, 0.1)`, backgroundColor: `rgba(9, 13, 20, 0.9)`, padding: spacing[16] }}>
              <p style={{ fontSize: typography.sizes.sm, textTransform: 'uppercase', letterSpacing: '0.2em', color: colors.white.secondary }}>Sesión</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[8] }}>
                {safeSessionOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onSessionChange(item)}
                    style={{
                      borderRadius: '9999px',
                      paddingLeft: spacing[16],
                      paddingRight: spacing[16],
                      paddingTop: spacing[8],
                      paddingBottom: spacing[8],
                      fontSize: typography.sizes.sm,
                      fontWeight: typography.weights.semibold,
                      transition: 'all 200ms ease',
                      border: session === item ? 'none' : `1px solid rgba(255, 255, 255, 0.1)`,
                      backgroundColor: session === item ? colors.gold.primary : `rgba(16, 20, 29, 1)`,
                      color: session === item ? colors.black.pure : colors.white.secondary,
                      cursor: 'pointer',
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[16], borderRadius: borders.radius.lg, border: `1px solid rgba(255, 255, 255, 0.1)`, backgroundColor: `rgba(9, 13, 20, 0.9)`, padding: spacing[16] }}>
              <p style={{ fontSize: typography.sizes.sm, textTransform: 'uppercase', letterSpacing: '0.2em', color: colors.white.secondary }}>Riesgo</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[8] }}>
                {safeRiskOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onRiskChange(item)}
                    style={{
                      borderRadius: '9999px',
                      paddingLeft: spacing[16],
                      paddingRight: spacing[16],
                      paddingTop: spacing[8],
                      paddingBottom: spacing[8],
                      fontSize: typography.sizes.sm,
                      fontWeight: typography.weights.semibold,
                      transition: 'all 200ms ease',
                      border: risk === item ? 'none' : `1px solid rgba(255, 255, 255, 0.1)`,
                      backgroundColor: risk === item ? colors.gold.primary : `rgba(16, 20, 29, 1)`,
                      color: risk === item ? colors.black.pure : colors.white.secondary,
                      cursor: 'pointer',
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[16], borderRadius: borders.radius.lg, border: `1px solid rgba(255, 255, 255, 0.1)`, backgroundColor: `rgba(9, 13, 20, 0.9)`, padding: spacing[16] }}>
              <p style={{ fontSize: typography.sizes.sm, textTransform: 'uppercase', letterSpacing: '0.2em', color: colors.white.secondary }}>Dirección</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[8] }}>
                {safeDirectionOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onDirectionChange(item)}
                    style={{
                      borderRadius: '9999px',
                      paddingLeft: spacing[16],
                      paddingRight: spacing[16],
                      paddingTop: spacing[8],
                      paddingBottom: spacing[8],
                      fontSize: typography.sizes.sm,
                      fontWeight: typography.weights.semibold,
                      transition: 'all 200ms ease',
                      border: direction === item ? 'none' : `1px solid rgba(255, 255, 255, 0.1)`,
                      backgroundColor: direction === item ? colors.gold.primary : `rgba(16, 20, 29, 1)`,
                      color: direction === item ? colors.black.pure : colors.white.secondary,
                      cursor: 'pointer',
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[16], borderRadius: borders.radius.lg, border: `1px solid rgba(255, 255, 255, 0.1)`, backgroundColor: `rgba(9, 13, 20, 0.9)`, padding: spacing[16] }}>
              <p style={{ fontSize: typography.sizes.sm, textTransform: 'uppercase', letterSpacing: '0.2em', color: colors.white.secondary }}>RR mínimo</p>
              <input
                type="number"
                min="0"
                step="0.1"
                value={rrMin}
                onChange={(event) => onRrMinChange(event.target.value)}
                style={{
                  width: '100%',
                  borderRadius: borders.radius.xl,
                  border: `1px solid rgba(255, 255, 255, 0.1)`,
                  backgroundColor: `rgba(16, 20, 29, 1)`,
                  paddingLeft: spacing[16],
                  paddingRight: spacing[16],
                  paddingTop: spacing[12],
                  paddingBottom: spacing[12],
                  fontSize: typography.sizes.sm,
                  color: colors.white.pure,
                  outline: 'none',
                  transition: 'all 200ms ease',
                }}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = colors.gold.primary;
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = `rgba(255, 255, 255, 0.1)`;
                }}
              />
            </div>
          </div>

          <p style={{ marginTop: spacing[16], fontSize: typography.sizes.sm, color: colors.white.secondary }}>
            Los filtros avanzados son demostrativos y actualizan la selección de alertas en tiempo real.
          </p>
        </motion.div>
      ) : null}
    </CARVIPIXCard>
  );
}
