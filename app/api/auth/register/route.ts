import { NextRequest, NextResponse } from "next/server";
import { backendDatabase } from "@/app/backend/core/database";
import { emailNotificationService } from "@/app/backend/notifications";
import { resolvePublicAppUrl } from "@/app/lib/url/public-app-url";
import { checkTokenIssueGuard, createVerificationToken, findUserByEmail, hashPassword } from "@/app/lib/auth/server";
import { createUser as createLocalUser, seedDemoStore } from "@/app/backend/core/local-auth-store";

type RegisterPayload = {
  nombre?: unknown;
  apellido?: unknown;
  correo?: unknown;
  telefono?: unknown;
  pais?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
  aceptaTerminos?: unknown;
};

function asTrimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  return /^[0-9\s\-+()]{8,}$/.test(phone.replace(/\s/g, ""));
}

function isValidPassword(password: string): boolean {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
}

function buildValidationErrors(payload: RegisterPayload): Record<string, string> {
  const nombre = asTrimmed(payload.nombre);
  const apellido = asTrimmed(payload.apellido);
  const correo = asTrimmed(payload.correo).toLowerCase();
  const telefono = asTrimmed(payload.telefono);
  const pais = asTrimmed(payload.pais);
  const password = asTrimmed(payload.password);
  const confirmPassword = asTrimmed(payload.confirmPassword);
  const aceptaTerminos = payload.aceptaTerminos === true;

  const errors: Record<string, string> = {};

  if (nombre.length < 2) {
    errors.nombre = "El nombre debe tener al menos 2 caracteres.";
  }

  if (apellido.length < 2) {
    errors.apellido = "El apellido debe tener al menos 2 caracteres.";
  }

  if (!isValidEmail(correo)) {
    errors.correo = "Ingresa un correo válido.";
  }

  if (!isValidPhone(telefono)) {
    errors.telefono = "Ingresa un teléfono válido.";
  }

  if (pais.length < 2) {
    errors.pais = "Selecciona un país válido.";
  }

  if (!isValidPassword(password)) {
    errors.password = "La contraseña debe tener mínimo 8 caracteres, letras y números.";
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = "Las contraseñas no coinciden.";
  }

  if (!aceptaTerminos) {
    errors.aceptaTerminos = "Debes aceptar términos y condiciones.";
  }

  return errors;
}

function createUserId(): string {
  return `usr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildVerificationUrl(request: NextRequest, verificationToken: string): string {
  const verificationUrl = new URL("/verificar-correo", resolvePublicAppUrl({ requestUrl: request.url }));
  verificationUrl.searchParams.set("token", verificationToken);
  return verificationUrl.toString();
}

async function sendWelcomeEmail(correo: string, nombre: string, verificationToken: string): Promise<{ delivered: boolean; provider?: string; messageId?: string }> {
  try {
    const result = await emailNotificationService.sendWelcomeRegistration({
      recipientEmail: correo,
      recipientName: nombre,
      verificationToken,
    });

    const delivered = result.accepted;

    console.info("[CARVIPIX][AUTH][REGISTER][WELCOME_EMAIL]", {
      email: correo,
      provider: result.provider,
      accepted: result.accepted,
      messageId: result.messageId,
    });

    return {
      delivered,
      provider: result.provider,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error("[CARVIPIX][AUTH][REGISTER][WELCOME_EMAIL_FAILED]", {
      email: correo,
      reason: error instanceof Error ? error.message : "unknown",
    });

    return {
      delivered: false,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as RegisterPayload & { inviteCode?: string };

    // ── Beta Privada: registros restringidos ──────────────────────────────
    const betaMode = process.env.BETA_PRIVATE_MODE === "true";
    let inviteCode = "";
    let betaCodeValid = false;
    
    if (betaMode) {
      inviteCode = String(body.inviteCode ?? "").trim().toUpperCase();
      if (!inviteCode || !/^FOUNDER-\d{3}$/.test(inviteCode)) {
        return NextResponse.json(
          { ok: false, error: "CARVIPIX está en Beta Privada. Se requiere un código de invitación para registrarse." },
          { status: 403 }
        );
      }
      if (backendDatabase.enabled) {
        const codeCheck = await backendDatabase.query<{ is_active: boolean; used_count: number; max_uses: number }>(
          `SELECT is_active, used_count, max_uses FROM beta_invitation_codes WHERE code = $1 LIMIT 1`,
          [inviteCode]
        ).catch(() => ({ rows: [] as Array<{ is_active: boolean; used_count: number; max_uses: number }> }));
        const codeRow = codeCheck.rows[0];
        if (!codeRow || !codeRow.is_active || codeRow.used_count >= codeRow.max_uses) {
          return NextResponse.json(
            { ok: false, error: "Código de invitación inválido, expirado o ya utilizado." },
            { status: 403 }
          );
        }
        betaCodeValid = true;
      }
    }

    const errors = buildValidationErrors(body);

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    const correo = asTrimmed(body.correo).toLowerCase();
    const password = asTrimmed(body.password);
    const nombre = asTrimmed(body.nombre);
    const apellido = asTrimmed(body.apellido);
    const telefono = asTrimmed(body.telefono);
    const pais = asTrimmed(body.pais);

    const existing = await findUserByEmail(correo);
    if (existing) {
      if (!existing.verificado) {
        const guard = await checkTokenIssueGuard({
          userId: existing.id,
          kind: "verification",
          maxInWindow: 5,
          windowMinutes: 60,
          minIntervalSeconds: 45,
        });

        if (!guard.allowed) {
          return NextResponse.json(
            {
              ok: true,
              message: "La cuenta ya existe y sigue pendiente de verificacion. Ya enviamos un correo recientemente.",
              emailDelivery: "rate-limited",
            },
            { status: 200 }
          );
        }

        const verificationToken = await createVerificationToken(existing.id);
        const welcomeEmail = await sendWelcomeEmail(correo, existing.nombre || nombre || "Usuario", verificationToken);

        return NextResponse.json(
          {
            ok: true,
            message: "Este correo ya tiene una cuenta pendiente de verificacion. Reenviamos el correo.",
            emailDelivery: welcomeEmail.delivered ? "sent" : "failed",
            verificationUrl: welcomeEmail.delivered ? undefined : buildVerificationUrl(request, verificationToken),
            warning: welcomeEmail.delivered ? undefined : "No pudimos reenviar el correo de verificacion. Solicita reenvio desde login.",
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { ok: false, errors: { correo: "Este correo ya está registrado." } },
        { status: 409 }
      );
    }

    const userId = createUserId();
    const passwordHash = hashPassword(password);

    if (!backendDatabase.enabled) {
      await seedDemoStore();
      await createLocalUser({
        id: userId,
        email: correo,
        nombre,
        apellido,
        passwordHash,
        telefono,
        pais,
      });

      const verificationToken = await createVerificationToken(userId);
      const welcomeEmail = await sendWelcomeEmail(correo, nombre, verificationToken);

      return NextResponse.json(
        {
          ok: true,
          message: "Cuenta creada. Verifica tu correo.",
          emailDelivery: welcomeEmail.delivered ? "sent" : "failed",
          verificationUrl: welcomeEmail.delivered ? undefined : buildVerificationUrl(request, verificationToken),
          warning: welcomeEmail.delivered ? undefined : "La cuenta fue creada, pero no pudimos enviar el correo de verificacion. Solicita reenvio.",
        },
        { status: 201 }
      );
    }

    await backendDatabase.withTransaction(async (client) => {
      await client.query(
        `
        INSERT INTO users (id, email, nombre, apellido, plan, estado, verificado, password_hash, telefono, pais, created_at)
        VALUES ($1, $2, $3, $4, 'demo', 'inactivo', false, $5, $6, $7, NOW())
        `,
        [userId, correo, nombre, apellido, passwordHash, telefono, pais]
      );

      // ── Crear membresía según tipo de registro ──────────────────────────────
      if (betaCodeValid && betaMode) {
        // Membresía FOUNDERS_BETA (90 días)
        const fechaFin = new Date();
        fechaFin.setDate(fechaFin.getDate() + 90);
        
        await client.query(
          `
          INSERT INTO memberships (user_id, plan, estado, fecha_inicio, fecha_fin, renovacion_automatica, origen)
          VALUES ($1, 'PRO', 'activo', NOW(), $2, false, 'FOUNDERS_BETA')
          ON CONFLICT (user_id) DO NOTHING
          `,
          [userId, fechaFin]
        );
        
        // Incrementar used_count del código
        await client.query(
          `UPDATE beta_invitation_codes SET used_count = used_count + 1 WHERE code = $1`,
          [inviteCode]
        );
      } else {
        // Membresía regular DEMO
        await client.query(
          `
          INSERT INTO memberships (user_id, plan, estado, fecha_inicio, renovacion_automatica)
          VALUES ($1, 'demo', 'inactivo', NOW(), false)
          ON CONFLICT (user_id) DO NOTHING
          `,
          [userId]
        );
      }
    });

    const verificationToken = await createVerificationToken(userId);
    const welcomeEmail = await sendWelcomeEmail(correo, nombre, verificationToken);

    return NextResponse.json(
      {
        ok: true,
        message: "Cuenta creada. Verifica tu correo.",
        emailDelivery: welcomeEmail.delivered ? "sent" : "failed",
        verificationUrl: welcomeEmail.delivered ? undefined : buildVerificationUrl(request, verificationToken),
        warning: welcomeEmail.delivered ? undefined : "La cuenta fue creada, pero no pudimos enviar el correo de verificacion. Solicita reenvio.",
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo registrar";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
