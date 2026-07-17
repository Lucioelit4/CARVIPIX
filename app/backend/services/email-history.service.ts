/**
 * EMAIL HISTORY SERVICE
 * Registra todos los emails enviados para auditoría y tracking
 */

import { backendDatabase } from "@/app/backend/core/database";

export type EmailHistoryRecord = {
  recipient_email: string;
  recipient_name?: string;
  email_type: string;
  subject: string;
  template_type?: string;
  from_email: string;
  from_name?: string;
  reply_to?: string;
  provider: "resend" | "smtp" | "noop";
  provider_message_id?: string;
  status: "sent" | "failed" | "queued";
  error_message?: string;
  user_id?: string;
  metadata?: Record<string, any>;
};

export class EmailHistoryService {
  static async logEmailSent(record: EmailHistoryRecord): Promise<string> {
    if (!backendDatabase.enabled) {
      console.log("[EMAIL-HISTORY] Sin BD disponible, email registrado en memoria");
      return `mem-${Date.now()}`;
    }

    try {
      const result = await backendDatabase.query<{ id: string }>(
        `INSERT INTO email_history (
          recipient_email,
          recipient_name,
          email_type,
          subject,
          template_type,
          from_email,
          from_name,
          reply_to,
          provider,
          provider_message_id,
          status,
          error_message,
          user_id,
          metadata,
          sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        RETURNING id`,
        [
          record.recipient_email,
          record.recipient_name || null,
          record.email_type,
          record.subject,
          record.template_type || null,
          record.from_email,
          record.from_name || null,
          record.reply_to || null,
          record.provider,
          record.provider_message_id || null,
          record.status,
          record.error_message || null,
          record.user_id || null,
          record.metadata ? JSON.stringify(record.metadata) : null,
        ]
      );

      const emailHistoryId = result.rows[0]?.id;

      console.info("[EMAIL-HISTORY] Correo registrado", {
        id: emailHistoryId,
        to: record.recipient_email,
        type: record.email_type,
        status: record.status,
      });

      return emailHistoryId;
    } catch (error) {
      console.error("[EMAIL-HISTORY] Error al registrar correo", error);
      throw error;
    }
  }

  static async updateEmailStatus(
    emailHistoryId: string,
    status: "sent" | "delivered" | "failed" | "bounced" | "opened" | "clicked",
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!backendDatabase.enabled) {
      return;
    }

    try {
      const statusColumn = status === "sent" ? "sent_at" : `${status}_at`;
      
      await backendDatabase.query(
        `UPDATE email_history 
         SET status = $1, 
             ${statusColumn} = NOW(),
             updated_at = NOW(),
             metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb
         WHERE id = $3`,
        [status, JSON.stringify(metadata || {}), emailHistoryId]
      );

      console.info("[EMAIL-HISTORY] Estado actualizado", {
        emailHistoryId,
        status,
      });
    } catch (error) {
      console.error("[EMAIL-HISTORY] Error al actualizar estado", error);
    }
  }

  static async getEmailHistory(filters?: {
    recipientEmail?: string;
    userId?: string;
    emailType?: string;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    if (!backendDatabase.enabled) {
      return [];
    }

    let query = "SELECT * FROM email_history WHERE 1=1";
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.recipientEmail) {
      query += ` AND recipient_email = $${paramIndex++}`;
      params.push(filters.recipientEmail);
    }

    if (filters?.userId) {
      query += ` AND user_id = $${paramIndex++}`;
      params.push(filters.userId);
    }

    if (filters?.emailType) {
      query += ` AND email_type = $${paramIndex++}`;
      params.push(filters.emailType);
    }

    if (filters?.status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters?.fromDate) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(filters.fromDate);
    }

    if (filters?.toDate) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(filters.toDate);
    }

    query += " ORDER BY created_at DESC";

    if (filters?.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit);
    }

    if (filters?.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(filters.offset);
    }

    try {
      const result = await backendDatabase.query(query, params);
      return result.rows;
    } catch (error) {
      console.error("[EMAIL-HISTORY] Error al obtener historial", error);
      return [];
    }
  }

  static async getEmailStats(): Promise<{
    totalSent: number;
    successRate: number;
    failureRate: number;
    bounceRate: number;
  }> {
    if (!backendDatabase.enabled) {
      return {
        totalSent: 0,
        successRate: 0,
        failureRate: 0,
        bounceRate: 0,
      };
    }

    try {
      const result = await backendDatabase.query(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) as bounced
         FROM email_history
         WHERE created_at >= NOW() - INTERVAL '30 days'`
      );

      const stats = result.rows[0];
      const total = parseInt(stats.total) || 0;
      const sent = parseInt(stats.sent) || 0;
      const failed = parseInt(stats.failed) || 0;
      const bounced = parseInt(stats.bounced) || 0;

      return {
        totalSent: total,
        successRate: total > 0 ? (sent / total) * 100 : 0,
        failureRate: total > 0 ? (failed / total) * 100 : 0,
        bounceRate: total > 0 ? (bounced / total) * 100 : 0,
      };
    } catch (error) {
      console.error("[EMAIL-HISTORY] Error al calcular estadísticas", error);
      return {
        totalSent: 0,
        successRate: 0,
        failureRate: 0,
        bounceRate: 0,
      };
    }
  }

  static async logEmailBounce(
    emailHistoryId: string,
    emailAddress: string,
    bounceType: "permanent" | "transient" | "complaint",
    reason: string
  ): Promise<void> {
    if (!backendDatabase.enabled) {
      return;
    }

    try {
      // Update email_history status
      await this.updateEmailStatus(emailHistoryId, "bounced", {
        bounceType,
        bounceReason: reason,
      });

      // Insert into email_bounces
      await backendDatabase.query(
        `INSERT INTO email_bounces (email_history_id, email_address, bounce_type, bounce_reason, bounce_timestamp)
         VALUES ($1, $2, $3, $4, NOW())`,
        [emailHistoryId, emailAddress, bounceType, reason]
      );

      console.warn("[EMAIL-HISTORY] Email rebotado registrado", {
        emailHistoryId,
        emailAddress,
        bounceType,
      });
    } catch (error) {
      console.error("[EMAIL-HISTORY] Error al registrar rebote", error);
    }
  }

  static async scheduleEmailRetry(
    emailHistoryId: string,
    retryReason: string,
    delayMinutes: number = 15
  ): Promise<void> {
    if (!backendDatabase.enabled) {
      return;
    }

    try {
      const nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);

      await backendDatabase.query(
        `INSERT INTO email_retries (email_history_id, attempt_number, retry_reason, next_retry_at)
         VALUES ($1, 1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [emailHistoryId, retryReason, nextRetryAt]
      );

      console.info("[EMAIL-HISTORY] Reenvío programado", {
        emailHistoryId,
        nextRetry: nextRetryAt,
      });
    } catch (error) {
      console.error("[EMAIL-HISTORY] Error al programar reenvío", error);
    }
  }
}
