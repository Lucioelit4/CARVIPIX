/**
 * SCHEMA: Email History & Tracking
 * Almacena registro completo de todos los emails enviados
 * Para auditoría, debugging y análisis de entregabilidad
 */

export const EMAIL_HISTORY_SCHEMA = `
-- Tabla de historial de emails
CREATE TABLE IF NOT EXISTS email_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Destinatario
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  
  -- Contenido
  email_type VARCHAR(100) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  template_type VARCHAR(100),
  
  -- Envío
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(255),
  reply_to VARCHAR(255),
  
  -- Proveedor
  provider VARCHAR(20) DEFAULT 'resend',
  provider_message_id VARCHAR(500),
  
  -- Estado
  status VARCHAR(20) DEFAULT 'queued', -- queued, sent, failed, bounced, spam
  delivery_status VARCHAR(50),
  error_message TEXT,
  
  -- Tracking
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadatos
  user_id VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  
  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Campos para debugging
  html_length INT,
  text_length INT,
  headers JSONB,
  metadata JSONB
);

-- Índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_email_history_recipient ON email_history(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_history_user_id ON email_history(user_id);
CREATE INDEX IF NOT EXISTS idx_email_history_email_type ON email_history(email_type);
CREATE INDEX IF NOT EXISTS idx_email_history_status ON email_history(status);
CREATE INDEX IF NOT EXISTS idx_email_history_created_at ON email_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_history_sent_at ON email_history(sent_at DESC);

-- Índice compuesto para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_email_history_user_status ON email_history(user_id, status);
CREATE INDEX IF NOT EXISTS idx_email_history_recipient_status ON email_history(recipient_email, status);

-- Tabla de plantillas de email (configurables desde admin)
CREATE TABLE IF NOT EXISTS email_templates_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  template_type VARCHAR(100) UNIQUE NOT NULL,
  
  -- Personalización
  from_email VARCHAR(255),
  from_name VARCHAR(255),
  subject_template TEXT NOT NULL,
  
  -- Configuración
  is_active BOOLEAN DEFAULT true,
  requires_verification BOOLEAN DEFAULT false,
  
  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de bounce/spam tracking
CREATE TABLE IF NOT EXISTS email_bounces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  email_history_id UUID REFERENCES email_history(id) ON DELETE CASCADE,
  email_address VARCHAR(255) NOT NULL,
  
  bounce_type VARCHAR(50), -- permanent, transient, complaint
  bounce_reason VARCHAR(500),
  bounce_timestamp TIMESTAMP WITH TIME ZONE,
  
  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_bounces_email ON email_bounces(email_address);
CREATE INDEX IF NOT EXISTS idx_email_bounces_type ON email_bounces(bounce_type);

-- Tabla de intentos de reenvío
CREATE TABLE IF NOT EXISTS email_retries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  email_history_id UUID REFERENCES email_history(id) ON DELETE CASCADE,
  
  attempt_number INT DEFAULT 1,
  retry_reason VARCHAR(500),
  
  next_retry_at TIMESTAMP WITH TIME ZONE,
  max_retries INT DEFAULT 5,
  
  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_retries_next_retry ON email_retries(next_retry_at);
`;

export async function initializeEmailSchema(client: any) {
  try {
    await client.query(EMAIL_HISTORY_SCHEMA);
    console.log("✅ Email history schema initialized");
  } catch (error) {
    console.error("❌ Error initializing email schema:", error);
    throw error;
  }
}
