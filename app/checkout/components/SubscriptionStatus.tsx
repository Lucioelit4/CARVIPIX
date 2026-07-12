type SubscriptionStatusProps = {
  subscriptionId: string;
  paypalStatus: string;
  internalStatus: string;
  nextBillingTime?: string | null;
};

export default function SubscriptionStatus({ subscriptionId, paypalStatus, internalStatus, nextBillingTime }: SubscriptionStatusProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/80">
      <p><span className="text-white/60">Subscription ID:</span> {subscriptionId}</p>
      <p className="mt-1"><span className="text-white/60">PayPal:</span> {paypalStatus}</p>
      <p className="mt-1"><span className="text-white/60">Interno:</span> {internalStatus}</p>
      <p className="mt-1"><span className="text-white/60">Proximo cobro:</span> {nextBillingTime ? new Date(nextBillingTime).toLocaleString("es-ES") : "Pendiente"}</p>
    </div>
  );
}
