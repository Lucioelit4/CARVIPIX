export type MembershipPlan = "pro" | "premium" | "enterprise";

function normalize(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

export function resolveMembershipPlanForProduct(input: {
  productId: string;
  productType?: string | null;
}): MembershipPlan | null {
  const productId = normalize(input.productId);
  const productType = normalize(input.productType);

  if (productId === "plan-basic" || productId === "plan-pro" || productType === "plan_pro") {
    return "pro";
  }

  if (productId === "plan-advanced" || productId === "plan-premium" || productType === "plan_premium") {
    return "premium";
  }

  if (productId === "plan-enterprise" || productType === "plan_enterprise") {
    return "enterprise";
  }

  return null;
}

export function calculateMembershipExpiry(input: {
  now: Date;
  plan: MembershipPlan;
  currentExpiry?: Date | null;
}): Date {
  const base =
    input.currentExpiry && input.currentExpiry.getTime() > input.now.getTime()
      ? input.currentExpiry
      : input.now;

  const days = input.plan === "enterprise" ? 365 : 30;
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

export function buildMembershipSourceTag(orderId: string): string {
  return `payment_order:${orderId}`;
}

export function shouldSkipActivation(input: {
  membershipStatus?: string | null;
  membershipSource?: string | null;
  sourceTag: string;
}): boolean {
  return normalize(input.membershipStatus) === "activo" && normalize(input.membershipSource) === normalize(input.sourceTag);
}
