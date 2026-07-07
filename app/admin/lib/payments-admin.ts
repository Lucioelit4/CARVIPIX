export type AdminPaymentOrderRow = {
  orderId: string;
  orderStatus: string;
  transactionStatus: string | null;
  userId: string;
  userEmail: string | null;
  amountTotal: number;
  currency: string;
  provider: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminPaymentOrderDetail = {
  order: {
    id: string;
    external_order_code: string;
    user_id: string;
    user_email: string | null;
    user_nombre: string | null;
    user_apellido: string | null;
    order_status: string;
    amount_subtotal: number;
    amount_tax: number;
    amount_total: number;
    currency: string;
    payment_method_requested: string | null;
    provider_preferred: string | null;
    metadata: unknown;
    created_at: string;
    updated_at: string;
    transaction_id: string | null;
    transaction_status: string | null;
    provider_payment_id: string | null;
    provider: string | null;
  };
  timeline: Array<{
    id: string;
    event_type: string;
    event_source: string;
    event_data: unknown;
    correlation_id: string | null;
    occurred_at: string;
    actor: string | null;
  }>;
  refunds: Array<{
    id: string;
    payment_transaction_id: string;
    provider_refund_id: string | null;
    amount: number;
    currency: string;
    status: string;
    reason: string | null;
    requested_by: string;
    requested_at: string;
    completed_at: string | null;
    metadata: unknown;
  }>;
  attempts: Array<{
    id: string;
    payment_transaction_id: string;
    operation: string;
    status: string;
    request_payload: unknown;
    response_payload: unknown;
    http_status: number | null;
    latency_ms: number | null;
    error_message: string | null;
    retried_count: number;
    created_at: string;
  }>;
  webhooks: Array<{
    id: string;
    provider: string;
    provider_event_id: string;
    event_type: string;
    signature_valid: boolean;
    process_status: string;
    first_seen_at: string;
    processed_at: string | null;
    error_message: string | null;
  }>;
};

export type AdminPaymentsFilters = {
  orderStatus: string;
  provider: string;
  from: string;
  to: string;
  q: string;
};

export function buildAdminPaymentsQuery(filters: AdminPaymentsFilters): string {
  const params = new URLSearchParams();

  if (filters.orderStatus.trim()) {
    params.set("orderStatus", filters.orderStatus.trim());
  }

  if (filters.provider.trim()) {
    params.set("provider", filters.provider.trim());
  }

  if (filters.from.trim()) {
    params.set("from", filters.from.trim());
  }

  if (filters.to.trim()) {
    params.set("to", filters.to.trim());
  }

  if (filters.q.trim()) {
    params.set("q", filters.q.trim());
  }

  params.set("limit", "250");

  const asText = params.toString();
  return asText.length > 0 ? `?${asText}` : "";
}

export function formatMoney(amount: number, currency: string): string {
  const value = Number.isFinite(amount) ? amount : 0;
  return `${currency.toUpperCase()} ${value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function fetchAdminOrders(filters: AdminPaymentsFilters): Promise<AdminPaymentOrderRow[]> {
  const query = buildAdminPaymentsQuery(filters);
  const response = await fetch(`/api/admin/payments/orders${query}`, { cache: "no-store" });
  const payload = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    data?: AdminPaymentOrderRow[];
    error?: string;
  };

  if (!response.ok || !payload.ok || !payload.data) {
    throw new Error(payload.error || "No se pudo cargar el listado de pagos.");
  }

  return payload.data;
}

export async function fetchAdminOrderDetail(orderId: string): Promise<AdminPaymentOrderDetail> {
  const response = await fetch(`/api/admin/payments/orders/${encodeURIComponent(orderId)}`, { cache: "no-store" });
  const payload = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    data?: AdminPaymentOrderDetail;
    error?: string;
  };

  if (!response.ok || !payload.ok || !payload.data) {
    throw new Error(payload.error || "No se pudo cargar el detalle de la orden.");
  }

  return payload.data;
}
