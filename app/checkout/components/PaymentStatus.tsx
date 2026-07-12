type PaymentStatusProps = {
  statusLine: string;
  error?: string | null;
};

export default function PaymentStatus({ statusLine, error }: PaymentStatusProps) {
  return (
    <div className="space-y-3">
      <p className="text-white/75">{statusLine}</p>
      {error ? <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}
    </div>
  );
}
