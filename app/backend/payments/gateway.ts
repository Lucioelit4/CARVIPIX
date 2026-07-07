import "server-only";

import type { PaymentAuthorizationRequest, PaymentAuthorizationResult, PaymentGateway, PaymentGatewayProvider } from "./types";

function resolveProvider(): PaymentGatewayProvider {
  const raw = process.env.PAYMENT_GATEWAY_PROVIDER?.trim().toLowerCase();
  if (raw === "stripe" || raw === "mercadopago" || raw === "openpay" || raw === "custom") {
    return raw;
  }

  return "mock";
}

class MockPaymentGateway implements PaymentGateway {
  readonly provider: PaymentGatewayProvider = "mock";

  async authorizePayment(input: PaymentAuthorizationRequest): Promise<PaymentAuthorizationResult> {
    return {
      status: "approved",
      rawResponse: {
        provider: this.provider,
        simulated: true,
        method: input.method,
      },
    };
  }
}

class StripePaymentGateway implements PaymentGateway {
  readonly provider: PaymentGatewayProvider = "stripe";

  async authorizePayment(_input: PaymentAuthorizationRequest): Promise<PaymentAuthorizationResult> {
    // Arquitectura preparada para integración real posterior (PaymentIntents + Webhooks).
    throw new Error("Stripe gateway aún no está conectado.");
  }
}

class MercadoPagoPaymentGateway implements PaymentGateway {
  readonly provider: PaymentGatewayProvider = "mercadopago";

  async authorizePayment(_input: PaymentAuthorizationRequest): Promise<PaymentAuthorizationResult> {
    // Arquitectura preparada para integración real posterior (Preferences + Webhooks).
    throw new Error("Mercado Pago gateway aún no está conectado.");
  }
}

class OpenpayPaymentGateway implements PaymentGateway {
  readonly provider: PaymentGatewayProvider = "openpay";

  async authorizePayment(_input: PaymentAuthorizationRequest): Promise<PaymentAuthorizationResult> {
    // Arquitectura preparada para integración real posterior (charges/cards/webhooks).
    throw new Error("Openpay gateway aún no está conectado.");
  }
}

class CustomPaymentGateway implements PaymentGateway {
  readonly provider: PaymentGatewayProvider = "custom";

  async authorizePayment(_input: PaymentAuthorizationRequest): Promise<PaymentAuthorizationResult> {
    // Punto de extensión para integraciones propietarias.
    throw new Error("Custom gateway aún no está conectado.");
  }
}

export function createPaymentGateway(): PaymentGateway {
  const provider = resolveProvider();

  if (provider === "stripe") {
    return new StripePaymentGateway();
  }

  if (provider === "mercadopago") {
    return new MercadoPagoPaymentGateway();
  }

  if (provider === "openpay") {
    return new OpenpayPaymentGateway();
  }

  if (provider === "custom") {
    return new CustomPaymentGateway();
  }

  return new MockPaymentGateway();
}
