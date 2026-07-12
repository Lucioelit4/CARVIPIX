export type AdminOrdersFilters = {
  orderStatus?: string;
  transactionStatus?: string;
  provider?: string;
  userQuery?: string;
  from?: string;
  to?: string;
  limit: number;
};

function normalize(value: string | null | undefined): string | undefined {
  const next = String(value ?? "").trim();
  return next.length > 0 ? next : undefined;
}

function isValidDateInput(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
}

export function parseOrdersFilters(input: URLSearchParams): AdminOrdersFilters {
  const orderStatus = normalize(input.get("orderStatus") ?? input.get("status"));
  const transactionStatus = normalize(input.get("transactionStatus"));
  const provider = normalize(input.get("provider"));
  const userQuery = normalize(input.get("q") ?? input.get("user"));
  const from = normalize(input.get("from"));
  const to = normalize(input.get("to"));
  const limitRaw = Number(input.get("limit") ?? 100);

  return {
    orderStatus,
    transactionStatus,
    provider,
    userQuery,
    from: isValidDateInput(from) ? from : undefined,
    to: isValidDateInput(to) ? to : undefined,
    limit: Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 500)) : 100,
  };
}

export function buildOrdersWhereClause(filters: AdminOrdersFilters): {
  whereClause: string;
  params: Array<string | number | Date>;
} {
  const params: Array<string | number | Date> = [];
  const parts: string[] = [];

  if (filters.orderStatus) {
    params.push(filters.orderStatus);
    parts.push(`po.order_status = $${params.length}`);
  }

  if (filters.transactionStatus) {
    params.push(filters.transactionStatus);
    parts.push(`pt.status = $${params.length}`);
  }

  if (filters.provider) {
    params.push(filters.provider);
    parts.push(`pt.provider = $${params.length}`);
  }

  if (filters.userQuery) {
    params.push(`%${filters.userQuery.toLowerCase()}%`);
    parts.push(`LOWER(CONCAT_WS(' ', po.user_id, u.email, u.nombre, u.apellido)) LIKE $${params.length}`);
  }

  if (filters.from) {
    params.push(new Date(filters.from));
    parts.push(`po.created_at >= $${params.length}`);
  }

  if (filters.to) {
    const endOfDay = new Date(filters.to);
    endOfDay.setHours(23, 59, 59, 999);
    params.push(endOfDay);
    parts.push(`po.created_at <= $${params.length}`);
  }

  return {
    whereClause: parts.length > 0 ? `WHERE ${parts.join(" AND ")}` : "",
    params,
  };
}

export type LocalPaymentLike = {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  fecha: string;
};

export type LocalUserLike = {
  id: string;
  email?: string;
  nombre?: string;
  apellido?: string;
  excludeFromCommercialMetrics?: boolean;
};

export function filterLocalPayments(
  payments: LocalPaymentLike[],
  users: LocalUserLike[],
  filters: AdminOrdersFilters
): Array<{
  orderId: string;
  orderStatus: string;
  transactionStatus: string;
  userId: string;
  userEmail: string | null;
  amountTotal: number;
  currency: string;
  provider: string;
  createdAt: string;
  updatedAt: string;
}> {
  const usersById = new Map(users.map((user) => [user.id, user]));

  return payments
    .filter((payment) => {
      const user = usersById.get(payment.userId);
      if (user?.excludeFromCommercialMetrics) {
        return false;
      }

      if (filters.orderStatus && payment.status !== filters.orderStatus) {
        return false;
      }

      if (filters.transactionStatus && payment.status !== filters.transactionStatus) {
        return false;
      }

      if (filters.provider && filters.provider !== "custom") {
        return false;
      }

      if (filters.userQuery) {
        const haystack = `${payment.userId} ${user?.email ?? ""} ${user?.nombre ?? ""} ${user?.apellido ?? ""}`.toLowerCase();
        if (!haystack.includes(filters.userQuery.toLowerCase())) {
          return false;
        }
      }

      const createdAt = new Date(payment.fecha);
      if (filters.from && createdAt < new Date(filters.from)) {
        return false;
      }

      if (filters.to) {
        const endOfDay = new Date(filters.to);
        endOfDay.setHours(23, 59, 59, 999);
        if (createdAt > endOfDay) {
          return false;
        }
      }

      return true;
    })
    .slice(0, filters.limit)
    .map((payment) => ({
      orderId: payment.id,
      orderStatus: payment.status,
      transactionStatus: payment.status,
      userId: payment.userId,
      userEmail: usersById.get(payment.userId)?.email ?? null,
      amountTotal: payment.amount,
      currency: payment.currency,
      provider: "custom",
      createdAt: payment.fecha,
      updatedAt: payment.fecha,
    }));
}
