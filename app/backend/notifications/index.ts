import "server-only";

import { EmailNotificationService } from "./service";

export * from "./types";
export * from "./service";

export const emailNotificationService = new EmailNotificationService();
