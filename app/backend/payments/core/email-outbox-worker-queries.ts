export const ACQUIRE_PENDING_EMAIL_OUTBOX_SQL = `
        WITH locked AS (
          SELECT id
          FROM payment_outbox_events
          WHERE status = 'pending'
            AND event_name = 'email.transactional.requested'
            AND available_at <= NOW()
          ORDER BY available_at ASC
          LIMIT $1
          FOR UPDATE SKIP LOCKED
        )
        UPDATE payment_outbox_events po
        SET status = 'processing',
            attempts = po.attempts + 1
        FROM locked
        WHERE po.id = locked.id
        RETURNING po.id, po.aggregate_id, po.event_name, po.payload, po.status, po.attempts, po.available_at, po.created_at
        `;
