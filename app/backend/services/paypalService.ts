/**
 * PayPal Integration for CARVIPIX EA Licenses
 * Uses native fetch (Node.js 18+)
 */

import { backendDatabase } from "@/app/backend/core/database";
import { sendLicenseEmail } from "./emailService";
import { randomUUID } from "crypto";

class PayPalService {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID || "";
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || "";
    this.baseUrl = process.env.PAYPAL_ENV === "production"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.accessToken;
    }

    const auth = Buffer.from(this.clientId + ":" + this.clientSecret).toString("base64");

    const response = await fetch(this.baseUrl + "/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: "Basic " + auth,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error("Failed to get PayPal token: " + response.status);
    }

    const data = await response.json() as { access_token: string; expires_in: number };
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;

    return this.accessToken;
  }

  async createOrder(tier: "BASIC" | "PRO" | "ENTERPRISE", returnUrl: string) {
    const token = await this.getAccessToken();

    const pricing = {
      BASIC: { price: "19.99", description: "CARVIPIX Plan BASIC - 1 mes", installations: 1 },
      PRO: { price: "150", description: "CARVIPIX Plan PRO - 1 mes", installations: 5 },
      ENTERPRISE: { price: "999", description: "CARVIPIX Bot EA MT5 - Licencia unica", installations: 999 },
    };

    const tierData = pricing[tier];

    const orderData = {
      intent: "CAPTURE",
      purchase_units: [{
        amount: {
          currency_code: "USD",
          value: tierData.price,
          breakdown: { item_total: { currency_code: "USD", value: tierData.price } },
        },
        items: [{
          name: tierData.description,
          quantity: "1",
          unit_amount: { currency_code: "USD", value: tierData.price },
        }],
        custom_id: tier,
      }],
      application_context: {
        return_url: returnUrl,
        cancel_url: returnUrl,
        brand_name: "CARVIPIX",
        user_action: "PAY_NOW",
      },
    };

    const response = await fetch(this.baseUrl + "/v2/checkout/orders", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error("Failed to create order: " + response.status);
    }

    const data = await response.json() as { id: string; links: Array<{ rel: string; href: string }> };

    return {
      orderId: data.id,
      approvalUrl: data.links.find((l) => l.rel === "approve")?.href,
      tier,
      price: tierData.price,
      installations: tierData.installations,
    };
  }

  async captureOrder(orderId: string, userId: string, userEmail: string) {
    const token = await this.getAccessToken();

    const response = await fetch(this.baseUrl + "/v2/checkout/orders/" + orderId + "/capture", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to capture order: " + response.status);
    }

    const order = await response.json() as {
      status: string;
      payer: { email_address: string; name: { given_name: string; surname: string } };
      purchase_units: Array<{ custom_id: string; amount: { value: string; currency_code: string } }>;
    };

    if (order.status !== "COMPLETED") {
      throw new Error("Order status: " + order.status);
    }

    const tier = order.purchase_units[0].custom_id;
    const tierConfig: Record<string, { max_installations: number; days: number }> = {
      BASIC: { max_installations: 1, days: 365 },
      PRO: { max_installations: 5, days: 365 },
      ENTERPRISE: { max_installations: 999, days: 365 },
    };

    const config = tierConfig[tier] || { max_installations: 1, days: 365 };
    const license_id = "LIC-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.days);

    const result = await backendDatabase.query(
      "INSERT INTO bot_mt5_licenses (id, license_id, user_id, status, subscription_tier, created_at, expires_at, max_installations, activated_at) VALUES (, , , , , NOW(), , , NOW()) RETURNING id, license_id, subscription_tier, expires_at",
      [randomUUID(), license_id, userId, "ACTIVE", tier, expiresAt, config.max_installations]
    );

    const license = result.rows[0];
    const downloadLink = (process.env.APP_URL || "") + "/download-ea?license=" + license_id;

    await sendLicenseEmail({
      license_id: license.license_id,
      user_email: userEmail,
      user_name: order.payer.name.given_name,
      subscription_tier: license.subscription_tier,
      expires_at: license.expires_at,
      download_link: downloadLink,
    });

    return {
      success: true,
      license_id: license.license_id,
      subscription_tier: license.subscription_tier,
      expires_at: license.expires_at,
    };
  }

  async verifyWebhookSignature(
    transmissionId: string,
    transmissionTime: string,
    certUrl: string,
    webhookBody: string,
    signature: string
  ): Promise<boolean> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(this.baseUrl + "/v1/notifications/verify-webhook-signature", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transmission_id: transmissionId,
          transmission_time: transmissionTime,
          cert_url: certUrl,
          auth_algo: "SHA256withRSA",
          transmission_sig: signature,
          webhook_body: webhookBody,
        }),
      });

      const data = await response.json() as { verification_status: string };
      return data.verification_status === "SUCCESS";
    } catch {
      return false;
    }
  }
}

export const paypalService = new PayPalService();
export default paypalService;