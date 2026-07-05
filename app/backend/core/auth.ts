export interface AuthPrincipal {
  id: string;
  roles: string[];
  permissions?: string[];
}

export interface AuthContext {
  requestId: string;
  principal: AuthPrincipal | null;
  metadata?: Record<string, unknown>;
}

export interface AuthorizationRequest {
  context: AuthContext;
  action: string;
  resource: string;
}

export interface AuthorizationDecision {
  allowed: boolean;
  reason?: string;
}

export interface AuthorizationPort {
  authorize(request: AuthorizationRequest): Promise<AuthorizationDecision>;
}

export class NoopAuthorizationPort implements AuthorizationPort {
  async authorize(): Promise<AuthorizationDecision> {
    return {
      allowed: true,
      reason: "Authorization provider not configured yet",
    };
  }
}

export function createAnonymousAuthContext(requestId: string, metadata?: Record<string, unknown>): AuthContext {
  return {
    requestId,
    principal: null,
    metadata,
  };
}
