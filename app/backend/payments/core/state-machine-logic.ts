import type { MembershipStatus, PaymentOrderStatus, PaymentTransactionStatus, SubscriptionStatus } from "./types";

type TransitionMap<TState extends string> = Record<TState, readonly TState[]>;

const orderTransitions: TransitionMap<PaymentOrderStatus> = {
  created: ["pending_provider", "cancelled", "expired"],
  pending_provider: ["awaiting_confirmation", "failed", "cancelled", "expired"],
  awaiting_confirmation: ["paid", "failed", "cancelled", "expired"],
  paid: ["partially_refunded", "refunded"],
  failed: [],
  cancelled: [],
  refunded: [],
  partially_refunded: ["refunded"],
  expired: [],
};

const transactionTransitions: TransitionMap<PaymentTransactionStatus> = {
  initiated: ["authorized", "failed"],
  authorized: ["captured", "failed"],
  captured: ["settled", "partially_refunded", "refunded", "chargeback"],
  settled: ["partially_refunded", "refunded", "chargeback"],
  failed: [],
  refunded: [],
  partially_refunded: ["refunded"],
  chargeback: [],
};

const subscriptionTransitions: TransitionMap<SubscriptionStatus> = {
  trialing: ["active", "cancelled", "expired"],
  active: ["past_due", "paused", "cancelled", "expired"],
  past_due: ["active", "paused", "cancelled", "expired"],
  paused: ["active", "cancelled", "expired"],
  cancelled: [],
  expired: [],
};

const membershipTransitions: TransitionMap<MembershipStatus> = {
  inactive: ["active", "cancelled"],
  active: ["grace_period", "suspended", "cancelled"],
  grace_period: ["active", "suspended", "cancelled"],
  suspended: ["active", "cancelled"],
  cancelled: [],
};

function canTransition<TState extends string>(map: TransitionMap<TState>, from: TState, to: TState): boolean {
  return map[from].includes(to);
}

function assertTransition<TState extends string>(entity: string, map: TransitionMap<TState>, from: TState, to: TState): void {
  if (!canTransition(map, from, to)) {
    throw new Error(`Invalid ${entity} transition: ${from} -> ${to}`);
  }
}

export const PaymentStateMachine = {
  canTransitionOrder: (from: PaymentOrderStatus, to: PaymentOrderStatus) => canTransition(orderTransitions, from, to),
  transitionOrder: (from: PaymentOrderStatus, to: PaymentOrderStatus) => {
    assertTransition("order", orderTransitions, from, to);
    return to;
  },
  canTransitionTransaction: (from: PaymentTransactionStatus, to: PaymentTransactionStatus) => canTransition(transactionTransitions, from, to),
  transitionTransaction: (from: PaymentTransactionStatus, to: PaymentTransactionStatus) => {
    assertTransition("transaction", transactionTransitions, from, to);
    return to;
  },
  canTransitionSubscription: (from: SubscriptionStatus, to: SubscriptionStatus) => canTransition(subscriptionTransitions, from, to),
  transitionSubscription: (from: SubscriptionStatus, to: SubscriptionStatus) => {
    assertTransition("subscription", subscriptionTransitions, from, to);
    return to;
  },
  canTransitionMembership: (from: MembershipStatus, to: MembershipStatus) => canTransition(membershipTransitions, from, to),
  transitionMembership: (from: MembershipStatus, to: MembershipStatus) => {
    assertTransition("membership", membershipTransitions, from, to);
    return to;
  },
};
