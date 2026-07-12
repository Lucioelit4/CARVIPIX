"use client";

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: Record<string, unknown>) => {
        render: (selector: string) => Promise<void>;
        close: () => void;
      };
    };
  }
}

type PayPalSubscriptionCheckoutProps = {
  containerSelector: string;
  createSubscription: () => Promise<string>;
  onApprove: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  onError: (error: unknown) => void;
};

export function renderPayPalSubscriptionCheckout(props: PayPalSubscriptionCheckoutProps) {
  if (!window.paypal) {
    throw new Error("PayPal SDK no disponible");
  }

  return window.paypal.Buttons({
    style: {
      layout: "vertical",
      shape: "rect",
      label: "subscribe",
    },
    createSubscription: props.createSubscription,
    onApprove: props.onApprove,
    onCancel: props.onCancel,
    onError: props.onError,
  }).render(props.containerSelector);
}
