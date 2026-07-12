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

type PayPalOneTimeCheckoutProps = {
  containerSelector: string;
  createOrder: () => Promise<string>;
  onApprove: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  onError: (error: unknown) => void;
};

export function renderPayPalOneTimeCheckout(props: PayPalOneTimeCheckoutProps) {
  if (!window.paypal) {
    throw new Error("PayPal SDK no disponible");
  }

  return window.paypal.Buttons({
    style: {
      layout: "vertical",
      shape: "rect",
      label: "paypal",
    },
    createOrder: props.createOrder,
    onApprove: props.onApprove,
    onCancel: props.onCancel,
    onError: props.onError,
  }).render(props.containerSelector);
}
