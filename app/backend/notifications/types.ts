export type EmailSenderRole = "noreply" | "soporte" | "pagos";

export type TransactionalEmailTemplateId =
  | "welcome-registration"
  | "membership-payment-confirmed"
  | "membership-renewal"
  | "membership-expiration"
  | "payment-failed"
  | "payment-refunded"
  | "security-password-changed"
  | "security-new-login"
  | "security-suspicious-activity"
  | "wallet-deposit"
  | "wallet-withdrawal"
  | "wallet-profit"
  | "campaign-promotion";

export type EmailAddress = {
  name?: string;
  email: string;
};

export type EmailMessage = {
  to: EmailAddress | EmailAddress[];
  subject: string;
  html: string;
  text: string;
  from: EmailAddress;
  replyTo?: EmailAddress;
  headers?: Record<string, string>;
};

export type EmailSendResult = {
  accepted: boolean;
  provider: "smtp" | "noop";
  messageId?: string;
};

export type WelcomeRegistrationEmailInput = {
  recipientEmail: string;
  recipientName: string;
  verificationToken: string;
};

export type PasswordResetEmailInput = {
  recipientEmail: string;
  recipientName: string;
  resetToken: string;
};

export type WelcomeActivatedEmailInput = {
  recipientEmail: string;
  recipientName: string;
};

export type PasswordChangedEmailInput = {
  recipientEmail: string;
  recipientName: string;
};

export type PromotionCampaignEmailInput = {
  recipientEmail: string;
  recipientName: string;
  campaignName: string;
  headline: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  unsubscribeUrl?: string;
};

export type PaymentTransactionalEmailInput = {
  templateId:
    | "membership-payment-confirmed"
    | "membership-renewal"
    | "payment-failed"
    | "payment-refunded";
  recipientEmail: string;
  recipientName: string;
  paymentOrderId: string;
  amount?: number;
  currency?: string;
  provider?: string;
  providerEventId?: string;
  failureReason?: string;
};
