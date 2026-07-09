"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  Cpu,
  Gauge,
  Layers,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { getBotInstances, getBotLicense } from "@/app/lib/client-data-helpers";
import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard, colors, spacing } from "@/app/design-system";

type DashboardMetrics = {
  rendimiento30d: string;
  equity: string;
  balance: string;
  winRate: string;
  profitFactor: string;
  drawdown: string;
  operaciones: string;
  broker: "MT4" | "MT5" | "MT4 / MT5";
  estado: string;
};

const OUTCOME_ITEMS = [
  {
    icon: Bot,
    title: "Opera mientras trabajas",
    description: "Tu sistema mantiene ejecucion disciplinada 24/7 sin depender de tu tiempo libre.",
  },
  {
    icon: Brain,
    title: "Reduce emociones",
    description: "Cada decision responde a reglas objetivas, no a impulsos ni miedo de mercado.",
  },
  {
    icon: ShieldCheck,
    title: "Protege tu capital",
    description: "Controla riesgo por operacion con limites definidos antes de entrar al mercado.",
  },
  {
    icon: Layers,
    title: "Analiza miles de oportunidades",
    description: "Escanea multiples escenarios para identificar contextos con mejor probabilidad.",
  },
  {
    icon: Cpu,
    title: "Ejecuta automaticamente",
    description: "Entrada, TP y SL se procesan con velocidad y precision en un mismo flujo.",
  },
];

const BRAIN_FLOW = [
  "Mercado",
  "Filtros",
  "Confirmaciones",
  "Gestion de riesgo",
  "Entrada",
  "TP / SL",
  "Resultado",
];

const ACTION_FEED = [
  { symbol: "XAUUSD", side: "Compra", entry: "2338.45", tp: "2345.00", sl: "2332.00", state: "Ejecutada" },
  { symbol: "EURUSD", side: "Venta", entry: "1.07153", tp: "1.06900", sl: "1.07320", state: "TP Alcanzado" },
  { symbol: "GBPUSD", side: "Venta", entry: "1.26840", tp: "1.26200", sl: "1.27200", state: "Gestion activa" },
  { symbol: "BTCUSD", side: "Compra", entry: "61520", tp: "62880", sl: "60780", state: "Nueva senal" },
];

const FAQ_ITEMS = [
  {
    q: "Cuanto tiempo tarda en quedar operativo?",
    a: "El bot puede quedar instalado y listo el mismo dia con la guia de activacion incluida.",
  },
  {
    q: "Necesito estar mirando la pantalla todo el dia?",
    a: "No. Esta pensado para ejecutar de forma automatica bajo parametros definidos.",
  },
  {
    q: "Funciona en cualquier broker?",
    a: "La integración broker se habilita solo en entornos compatibles y después de completar la activación operativa correspondiente.",
  },
  {
    q: "Garantiza rentabilidad?",
    a: "No. Ninguna herramienta puede garantizar resultados futuros. Si ofrece disciplina, estructura y control de riesgo.",
  },
];

const GUARANTEE_ITEMS = [
  {
    icon: Zap,
    title: "Actualizaciones",
    description: "Mejoras continuas para mantener el sistema competitivo en escenarios cambiantes.",
  },
  {
    icon: ShieldCheck,
    title: "Seguridad",
    description: "Arquitectura con reglas operativas para reducir errores manuales y sobreexposicion.",
  },
  {
    icon: CheckCircle2,
    title: "Soporte",
    description: "Acompanamiento para activacion, validacion inicial y resolucion de dudas de uso.",
  },
  {
    icon: Cpu,
    title: "Compatibilidad",
    description: "Preparado para una futura activación controlada en ecosistemas MT4 y MT5 con requisitos claros de instalación.",
  },
];

export default function BotPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    rendimiento30d: "0 USD",
    equity: "0 USD",
    balance: "0 USD",
    winRate: "0%",
    profitFactor: "0",
    drawdown: "0%",
    operaciones: "0",
    broker: "MT4 / MT5",
    estado: "Inactivo",
  });

  useEffect(() => {
    const loadBotData = async () => {
      try {
        const [license, instances] = await Promise.all([getBotLicense(), getBotInstances()]);
        const primary = instances?.[0];

        if (!primary) {
          return;
        }

        const totalWins = Math.max(0, primary.stats.winningTrades * Math.max(0, primary.stats.avgWin));
        const totalLosses = Math.max(1, Math.abs(primary.stats.losingTrades * Math.min(0, primary.stats.avgLoss)));
        const inferredProfitFactor = totalWins / totalLosses;

        const baseBalance = 0;
        const profit = Number(primary.stats.profitLoss ?? 0);
        const equityValue = baseBalance + profit;

        setMetrics({
          rendimiento30d: `${profit >= 0 ? "+" : ""}${profit.toLocaleString("en-US", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })} USD`,
          equity: `${equityValue.toLocaleString("en-US", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })} USD`,
          balance: `${baseBalance.toLocaleString("en-US", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })} USD`,
          winRate: `${(primary.stats.winRate * 100).toFixed(1)}%`,
          profitFactor: inferredProfitFactor.toFixed(2),
          drawdown: "0%",
          operaciones: String(primary.stats.totalTrades),
          broker: license?.brokerConnected ?? "MT4 / MT5",
          estado: primary.status === "running" ? "Motor en vivo" : "Motor en preparacion",
        });
      } catch {
        setMetrics({
          rendimiento30d: "0 USD",
          equity: "0 USD",
          balance: "0 USD",
          winRate: "0%",
          profitFactor: "0",
          drawdown: "0%",
          operaciones: "0",
          broker: "MT4 / MT5",
          estado: "Inactivo",
        });
      }
    };

    loadBotData();
  }, []);

  const equityCurve = useMemo(() => {
    const values = [35, 38, 44, 42, 48, 54, 51, 60, 63, 69, 73, 79, 84, 88, 94];
    return values;
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: colors.black.pure,
        color: colors.white.pure,
        paddingLeft: spacing[16],
        paddingRight: spacing[16],
        paddingTop: spacing[16],
        paddingBottom: spacing[32],
      }}
    >
      <div className="bot-page-shell">
        <section className="bot-hero" aria-label="Hero BOT CARVIPIX PRO">
          <div className="hero-background-grid" />
          <div className="hero-glow hero-glow-left" />
          <div className="hero-glow hero-glow-right" />

          <div className="hero-content">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <CARVIPIXBadge variant="premium">AUTOMATIZACION CUANTITATIVA PREMIUM</CARVIPIXBadge>
              <h1 className="hero-title">Deja que la precision opere por ti cada minuto del mercado.</h1>
              <p className="hero-subtitle">
                BOT CARVIPIX PRO muestra la estructura de analisis, gestion de riesgo y automatizacion disponible cuando la activacion operativa y la conexion broker han sido completadas.
              </p>

              <div className="hero-cta-row">
                <Link href="/checkout?product=bot-carvipix-license" className="unstyled-link">
                  <CARVIPIXButton variant="premium" size="lg">
                    QUIERO EL BOT
                  </CARVIPIXButton>
                </Link>
                <a href="#resultados-bot" className="hero-secondary-cta">
                  Ver resultados
                  <ArrowRight size={16} />
                </a>
              </div>

              <div className="hero-metric-strip">
                <div className="hero-mini-stat">
                  <p>Rendimiento referencial</p>
                  <strong>{metrics.rendimiento30d}</strong>
                </div>
                <div className="hero-mini-stat">
                  <p>Win Rate referencial</p>
                  <strong>{metrics.winRate}</strong>
                </div>
                <div className="hero-mini-stat">
                  <p>Operaciones registradas</p>
                  <strong>{metrics.operaciones}</strong>
                </div>
                <div className="hero-mini-stat">
                  <p>Estado actual</p>
                  <strong>{metrics.estado}</strong>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="hero-visual-wrap"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
            >
              <div className="hero-orb-stage">
                <div className="hero-orb-ring hero-orb-ring-1" />
                <div className="hero-orb-ring hero-orb-ring-2" />
                <div className="hero-orb-core">
                  <Bot size={42} />
                </div>
                <div className="hero-orb-tag hero-orb-tag-top">AI ENGINE</div>
                <div className="hero-orb-tag hero-orb-tag-right">RISK LAYER</div>
                <div className="hero-orb-tag hero-orb-tag-bottom">AUTO EXECUTION</div>
              </div>

              <CARVIPIXCard variant="premium" padding="16">
                <div className="side-metrics-header">
                  <span>Rendimiento</span>
                  <CARVIPIXBadge variant="warning">Demo controlada</CARVIPIXBadge>
                </div>
                <div className="side-metrics-grid">
                  <div>
                    <p>Equity</p>
                    <strong>{metrics.equity}</strong>
                  </div>
                  <div>
                    <p>Profit Factor</p>
                    <strong>{metrics.profitFactor}</strong>
                  </div>
                  <div>
                    <p>Drawdown</p>
                    <strong>{metrics.drawdown}</strong>
                  </div>
                  <div>
                    <p>Broker</p>
                    <strong>{metrics.broker}</strong>
                  </div>
                </div>
              </CARVIPIXCard>
            </motion.div>
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <p>QUE HACE POR TI</p>
            <h2>Tu operativa pasa de reaccionar a ejecutar con criterio continuo.</h2>
          </div>
          <div className="outcome-grid">
            {OUTCOME_ITEMS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4, delay: idx * 0.06 }}
                >
                  <CARVIPIXCard variant="info" padding="16">
                    <div className="outcome-item">
                      <span className="outcome-icon">
                        <Icon size={18} />
                      </span>
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                      </div>
                    </div>
                  </CARVIPIXCard>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <p>EL CEREBRO DEL BOT</p>
            <h2>Un pipeline inteligente que convierte ruido en decisiones operables.</h2>
          </div>
          <CARVIPIXCard variant="premium" padding="16">
            <div className="brain-flow-wrap">
              {BRAIN_FLOW.map((step, index) => (
                <React.Fragment key={step}>
                  <div className="brain-step">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{step}</strong>
                  </div>
                  {index < BRAIN_FLOW.length - 1 ? <div className="brain-arrow">-&gt;</div> : null}
                </React.Fragment>
              ))}
            </div>
          </CARVIPIXCard>
        </section>

        <section className="section-block" id="resultados-bot">
          <div className="section-heading">
            <p>RESULTADOS</p>
            <h2>Dashboard con foco en performance y control de riesgo.</h2>
          </div>

          <CARVIPIXCard variant="premium" padding="16">
            <div className="results-grid">
              <div className="results-stats">
                <div className="metric-tile">
                  <span>Equity</span>
                  <strong>{metrics.equity}</strong>
                </div>
                <div className="metric-tile">
                  <span>Balance</span>
                  <strong>{metrics.balance}</strong>
                </div>
                <div className="metric-tile">
                  <span>Win Rate referencial</span>
                  <strong>{metrics.winRate}</strong>
                </div>
                <div className="metric-tile">
                  <span>Profit Factor</span>
                  <strong>{metrics.profitFactor}</strong>
                </div>
                <div className="metric-tile">
                  <span>Drawdown</span>
                  <strong>{metrics.drawdown}</strong>
                </div>
                <div className="metric-tile">
                  <span>Operaciones registradas</span>
                  <strong>{metrics.operaciones}</strong>
                </div>
              </div>

              <div className="equity-panel">
                <div className="equity-panel-header">
                  <h3>Equity Curve (30 dias)</h3>
                  <span>Referencia visual</span>
                </div>
                <div className="equity-chart" role="img" aria-label="Grafico equity">
                  {equityCurve.map((point, idx) => (
                    <motion.div
                      key={`${point}-${idx}`}
                      className="equity-bar"
                      initial={{ height: 8, opacity: 0 }}
                      whileInView={{ height: `${point}%`, opacity: 1 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ duration: 0.45, delay: idx * 0.03 }}
                    />
                  ))}
                </div>
                <p className="equity-note">Visualización ilustrativa. La activación real depende de infraestructura, validación y conexión broker.</p>
              </div>
            </div>
          </CARVIPIXCard>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <p>BOT EN ACCION</p>
            <h2>Visualiza el formato de senales, entradas y ejecución prevista dentro del flujo del bot.</h2>
          </div>

          <div className="action-grid">
            <CARVIPIXCard variant="info" padding="16">
              <h3 className="action-title">Flujo de ejecucion</h3>
              <div className="action-feed">
                {ACTION_FEED.map((item, idx) => (
                  <motion.div
                    key={`${item.symbol}-${idx}`}
                    className="action-row"
                    initial={{ opacity: 0, x: -14 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.35, delay: idx * 0.08 }}
                  >
                    <div>
                      <p className="action-symbol">{item.symbol} - {item.side}</p>
                      <p className="action-levels">Entrada {item.entry} | TP {item.tp} | SL {item.sl}</p>
                    </div>
                    <CARVIPIXBadge variant={item.state === "TP Alcanzado" ? "success" : "default"}>{item.state}</CARVIPIXBadge>
                  </motion.div>
                ))}
              </div>
            </CARVIPIXCard>

            <CARVIPIXCard variant="premium" padding="16">
              <h3 className="action-title">Ejecucion automatica</h3>
              <div className="execution-stack">
                <div className="execution-item">
                  <span>Senal validada</span>
                  <strong>XAUUSD Buy</strong>
                </div>
                <div className="execution-item">
                  <span>Entrada</span>
                  <strong>2338.45</strong>
                </div>
                <div className="execution-item">
                  <span>Take Profit</span>
                  <strong>2345.00</strong>
                </div>
                <div className="execution-item">
                  <span>Stop Loss</span>
                  <strong>2332.00</strong>
                </div>
                <div className="execution-item execution-item-highlight">
                  <span>Estado</span>
                  <strong>Activacion controlada requerida</strong>
                </div>
              </div>
            </CARVIPIXCard>
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <p>COMPATIBILIDAD</p>
            <h2>Preparado para integrarse en tu entorno de ejecucion profesional.</h2>
          </div>
          <div className="compat-grid">
            <CARVIPIXCard variant="info" padding="16">
              <div className="compat-card-title">
                <Gauge size={20} />
                <h3>Plataformas</h3>
              </div>
              <div className="compat-badges">
                <CARVIPIXBadge variant="premium">MT4</CARVIPIXBadge>
                <CARVIPIXBadge variant="premium">MT5</CARVIPIXBadge>
              </div>
              <p>Compatibilidad prevista para entornos MetaTrader soportados una vez completada la activación operativa.</p>
            </CARVIPIXCard>

            <CARVIPIXCard variant="info" padding="16">
              <div className="compat-card-title">
                <Activity size={20} />
                <h3>Instalacion</h3>
              </div>
              <p>Proceso guiado en 3 pasos: descargar, vincular cuenta y validar parametros de riesgo.</p>
            </CARVIPIXCard>

            <CARVIPIXCard variant="info" padding="16">
              <div className="compat-card-title">
                <TrendingUp size={20} />
                <h3>Requisitos</h3>
              </div>
              <p>Terminal MT4/MT5 activo, conexion estable y configuracion minima de gestion de riesgo.</p>
            </CARVIPIXCard>
          </div>
        </section>

        <section className="section-block pricing-block">
          <div className="section-heading">
            <p>PRECIO</p>
            <h2>Cuando ves el sistema completo, la decision se vuelve obvia.</h2>
          </div>
          <CARVIPIXCard variant="premium" padding="16">
            <div className="price-layout">
              <div>
                <p className="price-label">BOT CARVIPIX PRO</p>
                <h3 className="price-value">999 USD</h3>
                <p className="price-note">Pago unico. Acceso de por vida a esta version del bot.</p>
              </div>
              <div className="price-cta-wrap">
                <Link href="/checkout?product=bot-carvipix-license" className="unstyled-link">
                  <CARVIPIXButton variant="premium" size="lg">
                    COMENZAR AHORA
                  </CARVIPIXButton>
                </Link>
              </div>
            </div>
          </CARVIPIXCard>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <p>PREGUNTAS FRECUENTES</p>
            <h2>Resuelve dudas clave antes de activar tu sistema.</h2>
          </div>
          <div className="faq-wrap">
            {FAQ_ITEMS.map((faq) => (
              <details key={faq.q} className="faq-item">
                <summary>{faq.q}</summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <p>GARANTIAS</p>
            <h2>Soporte y evolucion para sostener una experiencia premium.</h2>
          </div>
          <div className="guarantee-grid">
            {GUARANTEE_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <CARVIPIXCard key={item.title} variant="info" padding="16">
                  <div className="guarantee-item">
                    <span className="guarantee-icon">
                      <Icon size={18} />
                    </span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                  </div>
                </CARVIPIXCard>
              );
            })}
          </div>
        </section>

        <section className="final-cta">
          <CARVIPIXCard variant="premium" padding="16">
            <div className="final-cta-inner">
              <div>
                <p>ULTIMO PASO</p>
                <h2>Activa un sistema que opera con disciplina cuando tu no puedes.</h2>
              </div>
              <Link href="/checkout?product=bot-carvipix-license" className="unstyled-link">
                <CARVIPIXButton variant="premium" size="lg">
                  ACTIVAR BOT AHORA
                </CARVIPIXButton>
              </Link>
            </div>
          </CARVIPIXCard>
        </section>
      </div>

      <style jsx>{`
        .bot-page-shell {
          margin: 0 auto;
          max-width: 1180px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .bot-hero {
          position: relative;
          overflow: hidden;
          border-radius: 28px;
          border: 1px solid rgba(212, 175, 55, 0.24);
          min-height: calc(100vh - 110px);
          padding: 40px;
          background:
            radial-gradient(circle at 18% 18%, rgba(20, 87, 180, 0.28), transparent 46%),
            radial-gradient(circle at 84% 10%, rgba(212, 175, 55, 0.2), transparent 40%),
            linear-gradient(160deg, #060b14 0%, #081224 54%, #04070f 100%);
        }

        .hero-background-grid {
          position: absolute;
          inset: 0;
          opacity: 0.24;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 34px 34px;
          mask-image: radial-gradient(circle at center, black 36%, transparent 96%);
        }

        .hero-glow {
          position: absolute;
          width: 340px;
          height: 340px;
          border-radius: 50%;
          filter: blur(55px);
          opacity: 0.34;
        }

        .hero-glow-left {
          background: rgba(17, 130, 255, 0.4);
          left: -140px;
          top: 18%;
        }

        .hero-glow-right {
          background: rgba(212, 175, 55, 0.34);
          right: -120px;
          top: 12%;
        }

        .hero-content {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1.18fr 0.82fr;
          gap: 28px;
          align-items: center;
          min-height: 100%;
        }

        .hero-title {
          margin-top: 16px;
          margin-bottom: 0;
          font-size: clamp(2rem, 4.8vw, 4rem);
          line-height: 1.04;
          letter-spacing: -0.02em;
          max-width: 680px;
        }

        .hero-subtitle {
          margin-top: 14px;
          margin-bottom: 0;
          font-size: clamp(1rem, 1.8vw, 1.2rem);
          color: rgba(255, 255, 255, 0.82);
          max-width: 640px;
        }

        .hero-cta-row {
          margin-top: 24px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 14px;
        }

        .hero-secondary-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 12px;
          padding: 11px 15px;
          transition: all 180ms ease;
          backdrop-filter: blur(8px);
        }

        .hero-secondary-cta:hover {
          border-color: rgba(212, 175, 55, 0.5);
          background: rgba(212, 175, 55, 0.1);
          color: #ffffff;
        }

        .hero-metric-strip {
          margin-top: 22px;
          display: grid;
          grid-template-columns: repeat(4, minmax(130px, 1fr));
          gap: 10px;
        }

        .hero-mini-stat {
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          background: rgba(3, 12, 26, 0.65);
          padding: 12px;
          backdrop-filter: blur(10px);
        }

        .hero-mini-stat p {
          margin: 0;
          font-size: 0.74rem;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .hero-mini-stat strong {
          display: block;
          margin-top: 6px;
          font-size: 1rem;
          color: #ffffff;
          line-height: 1.2;
        }

        .hero-visual-wrap {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .hero-orb-stage {
          position: relative;
          border-radius: 24px;
          min-height: 350px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: radial-gradient(circle at 50% 38%, rgba(255, 208, 64, 0.16), rgba(2, 7, 15, 0.96) 58%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .hero-orb-ring {
          position: absolute;
          border: 1px solid rgba(212, 175, 55, 0.45);
          border-radius: 50%;
          animation: spin 18s linear infinite;
        }

        .hero-orb-ring-1 {
          width: 250px;
          height: 250px;
        }

        .hero-orb-ring-2 {
          width: 300px;
          height: 300px;
          border-color: rgba(64, 174, 255, 0.45);
          animation-direction: reverse;
          animation-duration: 22s;
        }

        .hero-orb-core {
          width: 128px;
          height: 128px;
          border-radius: 50%;
          background: linear-gradient(140deg, #101825, #0a101b 55%, #111f2f);
          border: 1px solid rgba(255, 255, 255, 0.16);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #d4af37;
          box-shadow:
            0 0 0 8px rgba(212, 175, 55, 0.09),
            0 0 48px rgba(212, 175, 55, 0.28);
          animation: pulse 2.6s ease-in-out infinite;
          z-index: 1;
        }

        .hero-orb-tag {
          position: absolute;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(0, 0, 0, 0.5);
          font-size: 0.68rem;
          letter-spacing: 0.08em;
          color: rgba(255, 255, 255, 0.84);
        }

        .hero-orb-tag-top {
          top: 38px;
          left: 50%;
          transform: translateX(-50%);
        }

        .hero-orb-tag-right {
          right: 28px;
          top: 50%;
          transform: translateY(-50%);
        }

        .hero-orb-tag-bottom {
          left: 50%;
          bottom: 26px;
          transform: translateX(-50%);
        }

        .section-block {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .section-heading p {
          margin: 0;
          font-size: 0.76rem;
          letter-spacing: 0.14em;
          color: rgba(212, 175, 55, 0.84);
        }

        .section-heading h2 {
          margin: 8px 0 0;
          font-size: clamp(1.36rem, 2.8vw, 2rem);
          line-height: 1.2;
          max-width: 820px;
        }

        .outcome-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 12px;
        }

        .outcome-item,
        .guarantee-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .outcome-icon,
        .guarantee-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(160deg, rgba(212, 175, 55, 0.2), rgba(12, 34, 66, 0.7));
          color: #f3d169;
          flex-shrink: 0;
        }

        .outcome-item h3,
        .guarantee-item h3 {
          margin: 0;
          font-size: 1rem;
        }

        .outcome-item p,
        .guarantee-item p,
        .compat-grid p {
          margin: 8px 0 0;
          color: rgba(255, 255, 255, 0.74);
          font-size: 0.92rem;
          line-height: 1.45;
        }

        .brain-flow-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          justify-content: center;
        }

        .brain-step {
          min-width: 138px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(7, 12, 20, 0.76);
          padding: 12px;
          text-align: center;
        }

        .brain-step span {
          display: block;
          font-size: 0.68rem;
          color: rgba(255, 255, 255, 0.52);
          letter-spacing: 0.08em;
        }

        .brain-step strong {
          display: block;
          margin-top: 6px;
          color: #ffffff;
          font-size: 0.9rem;
        }

        .brain-arrow {
          color: rgba(212, 175, 55, 0.8);
          font-weight: 700;
        }

        .results-grid {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 14px;
        }

        .results-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .metric-tile {
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(7, 14, 24, 0.78);
          padding: 12px;
        }

        .metric-tile span {
          font-size: 0.76rem;
          color: rgba(255, 255, 255, 0.64);
        }

        .metric-tile strong {
          display: block;
          margin-top: 8px;
          font-size: 1.22rem;
        }

        .equity-panel {
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(5, 11, 19, 0.82);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .equity-panel-header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
        }

        .equity-panel-header h3 {
          margin: 0;
          font-size: 1rem;
        }

        .equity-panel-header span {
          font-size: 0.72rem;
          letter-spacing: 0.1em;
          color: rgba(212, 175, 55, 0.88);
        }

        .equity-chart {
          display: grid;
          grid-template-columns: repeat(15, minmax(0, 1fr));
          align-items: end;
          gap: 6px;
          min-height: 170px;
          border-radius: 10px;
          padding: 10px;
          background: linear-gradient(180deg, rgba(17, 39, 75, 0.42), rgba(6, 12, 20, 0.2));
        }

        .equity-bar {
          border-radius: 4px 4px 0 0;
          background: linear-gradient(180deg, rgba(90, 214, 140, 0.96), rgba(17, 126, 76, 0.94));
          min-height: 6px;
        }

        .equity-note {
          margin: 0;
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.58);
        }

        .action-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .action-title {
          margin: 0;
          font-size: 1.08rem;
        }

        .action-feed {
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .action-row {
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(7, 14, 24, 0.76);
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .action-symbol {
          margin: 0;
          font-size: 0.92rem;
          font-weight: 700;
        }

        .action-levels {
          margin: 4px 0 0;
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.62);
        }

        .execution-stack {
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .execution-item {
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(8, 16, 29, 0.74);
          padding: 10px;
        }

        .execution-item span {
          display: block;
          font-size: 0.72rem;
          color: rgba(255, 255, 255, 0.55);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .execution-item strong {
          display: block;
          margin-top: 6px;
          font-size: 0.98rem;
          color: #ffffff;
        }

        .execution-item-highlight {
          border-color: rgba(98, 220, 151, 0.54);
          box-shadow: 0 0 0 1px rgba(98, 220, 151, 0.22) inset;
        }

        .compat-grid,
        .guarantee-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .guarantee-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .compat-card-title {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .compat-card-title h3 {
          margin: 0;
        }

        .compat-badges {
          margin-top: 12px;
          display: flex;
          gap: 8px;
        }

        .pricing-block {
          padding-top: 6px;
        }

        .price-layout {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .price-label {
          margin: 0;
          font-size: 0.8rem;
          letter-spacing: 0.12em;
          color: rgba(255, 255, 255, 0.66);
        }

        .price-value {
          margin: 8px 0 0;
          font-size: clamp(2rem, 5vw, 3rem);
          color: #f0c955;
          line-height: 1;
        }

        .price-note {
          margin: 8px 0 0;
          color: rgba(255, 255, 255, 0.74);
        }

        .price-cta-wrap {
          display: flex;
          align-items: center;
        }

        .faq-wrap {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .faq-item {
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(8, 14, 23, 0.8);
          padding: 0 14px;
        }

        .faq-item summary {
          cursor: pointer;
          list-style: none;
          padding: 14px 0;
          font-weight: 700;
        }

        .faq-item p {
          margin: 0 0 14px;
          color: rgba(255, 255, 255, 0.75);
          line-height: 1.45;
        }

        .final-cta {
          padding-top: 6px;
          padding-bottom: 4px;
        }

        .final-cta-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .final-cta-inner p {
          margin: 0;
          font-size: 0.78rem;
          letter-spacing: 0.14em;
          color: rgba(212, 175, 55, 0.86);
        }

        .final-cta-inner h2 {
          margin: 8px 0 0;
          font-size: clamp(1.35rem, 2.6vw, 2.2rem);
          max-width: 760px;
        }

        .side-metrics-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .side-metrics-header span {
          font-size: 0.84rem;
          color: rgba(255, 255, 255, 0.76);
        }

        .side-metrics-grid {
          margin-top: 12px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .side-metrics-grid p {
          margin: 0;
          color: rgba(255, 255, 255, 0.58);
          font-size: 0.74rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .side-metrics-grid strong {
          margin-top: 7px;
          display: block;
          font-size: 1rem;
          color: #fff;
        }

        .unstyled-link {
          text-decoration: none;
          color: inherit;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @media (max-width: 1140px) {
          .hero-content {
            grid-template-columns: 1fr;
          }

          .hero-orb-stage {
            min-height: 290px;
          }

          .outcome-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .results-grid,
          .action-grid {
            grid-template-columns: 1fr;
          }

          .guarantee-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 860px) {
          .bot-hero {
            min-height: unset;
            padding: 24px;
          }

          .hero-metric-strip {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .results-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .compat-grid {
            grid-template-columns: 1fr;
          }

          .brain-flow-wrap {
            justify-content: flex-start;
          }

          .brain-arrow {
            width: 100%;
            text-align: center;
          }
        }

        @media (max-width: 640px) {
          .hero-title {
            font-size: 2rem;
          }

          .hero-subtitle {
            font-size: 0.95rem;
          }

          .hero-orb-tag-right {
            right: 12px;
          }

          .hero-orb-tag-bottom {
            bottom: 12px;
          }

          .outcome-grid,
          .guarantee-grid,
          .results-stats {
            grid-template-columns: 1fr;
          }

          .side-metrics-grid {
            grid-template-columns: 1fr;
          }

          .hero-cta-row,
          .price-layout,
          .final-cta-inner {
            align-items: stretch;
          }

          .hero-secondary-cta,
          .price-cta-wrap .unstyled-link,
          .final-cta .unstyled-link {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
