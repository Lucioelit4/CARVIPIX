import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

import { latestActiveLegalDocuments, LEGAL_DOCUMENTS_BASE, type LegalDocument } from "@/app/lib/legal/compliance-catalog";

async function readAppFile(relativePath: string): Promise<string> {
  const absolute = path.join(process.cwd(), ...relativePath.split("/"));
  return fs.readFile(absolute, "utf8");
}

function findBySlug(items: LegalDocument[], slug: string): LegalDocument[] {
  return items.filter((item) => item.slug === slug);
}

test("usuario no autenticado (contrato de ruta)", async () => {
  const source = await readAppFile("app/api/client/compliance/acceptances/route.ts");
  assert.match(source, /requireClientSession/);
  assert.match(source, /if \(!auth\.ok\) \{\s*return auth\.response;/s);
});

test("documentos obligatorios pendientes (contrato de ruta)", async () => {
  const source = await readAppFile("app/api/client/compliance/acceptances/route.ts");
  assert.match(source, /listMissingRequiredPaymentAcceptances/);
  assert.match(source, /canProceedToPayment:\s*missing\.length === 0/);
});

test("aceptacion completa (contrato de ruta)", async () => {
  const source = await readAppFile("app/api/client/compliance/acceptances/route.ts");
  assert.match(source, /recordUserLegalAcceptances/);
  assert.match(source, /accepted:\s*result\.accepted/);
  assert.match(source, /canProceedToPayment:\s*missing\.length === 0/);
});

test("version obsoleta", async () => {
  const base = LEGAL_DOCUMENTS_BASE[0];
  const docs: LegalDocument[] = [
    {
      ...base,
      slug: "terminos-condiciones",
      version: "3.0.0",
      status: "Activo",
      updatedAt: "2026-07-01T00:00:00.000Z",
    },
    {
      ...base,
      slug: "terminos-condiciones",
      version: "9.9.9",
      status: "Obsoleto",
      updatedAt: "2026-07-12T00:00:00.000Z",
    },
  ];

  const latest = latestActiveLegalDocuments(docs);
  assert.equal(latest.length, 1);
  assert.equal(latest[0].version, "3.0.0");
  assert.equal(latest[0].status, "Activo");
});

test("publicacion de nueva version", async () => {
  const base = LEGAL_DOCUMENTS_BASE[0];
  const docs: LegalDocument[] = [
    {
      ...base,
      slug: "terminos-condiciones",
      version: "3.0.0",
      status: "Activo",
      updatedAt: "2026-07-01T00:00:00.000Z",
    },
    {
      ...base,
      slug: "terminos-condiciones",
      version: "4.0.0",
      status: "Activo",
      updatedAt: "2026-07-12T00:00:00.000Z",
    },
  ];

  const latest = latestActiveLegalDocuments(docs);
  assert.equal(latest.length, 1);
  assert.equal(latest[0].version, "4.0.0");
});

test("usuario con aceptacion anterior (contrato de servicio)", async () => {
  const source = await readAppFile("app/backend/compliance/compliance-service.ts");
  assert.match(source, /listMissingRequiredPaymentAcceptances/);
  assert.match(source, /accepted\.get\(doc\.slug\) !== doc\.version/);
});

test("bloqueo 412 de orden PayPal", async () => {
  const source = await readAppFile("app/api/payments/paypal/orders/route.ts");
  assert.match(source, /listMissingRequiredPaymentAcceptances/);
  assert.match(source, /status:\s*412/);
});

test("bloqueo 412 de suscripcion", async () => {
  const source = await readAppFile("app/api/payments/paypal/subscriptions/route.ts");
  assert.match(source, /listMissingRequiredPaymentAcceptances/);
  assert.match(source, /status:\s*412/);
});

test("version manipulada desde frontend (contrato backend)", async () => {
  const source = await readAppFile("app/backend/compliance/compliance-service.ts");
  assert.match(source, /documentSlugs\?:\s*string\[\]/);
  assert.match(source, /selectedDocs = allActive\.filter\(\(doc\) => selectedSlugs\.has\(doc\.slug\)\)/);
  assert.match(source, /documentVersion:\s*doc\.version/);
  assert.doesNotMatch(source, /documentVersion:\s*input\./);
});

test("aislamiento entre usuarios (contrato de persistencia)", async () => {
  const source = await readAppFile("app/backend/compliance/compliance-service.ts");
  assert.match(source, /WHERE user_id = \$1/);
  assert.match(source, /listLocalAcceptancesByUser\(userId\)/);
});

test("permisos administrativos (contrato de ruta)", async () => {
  const source = await readAppFile("app/api/admin/compliance/route.ts");
  assert.match(source, /isValidAdminSession/);
  assert.match(source, /if \(!isAdminRequest\(request\)\) \{\s*return NextResponse\.json\(\{ ok: false, error: "Unauthorized" \}, \{ status: 401 \}\);/s);
});

test("auditoria de cambios (contrato de ruta)", async () => {
  const source = await readAppFile("app/api/admin/compliance/route.ts");
  assert.match(source, /appendAdminAuditLog/);
  assert.match(source, /resource:\s*"compliance:legal-documents"/);
  assert.match(source, /resource:\s*"compliance:videos"/);
});

test("persistencia DB en produccion (no dependiente de local)", async () => {
  const source = await readAppFile("app/backend/compliance/compliance-service.ts");
  assert.match(source, /if \(!backendDatabase\.enabled\)/);
  assert.match(source, /INSERT INTO legal_acceptances/);
  assert.match(source, /FROM legal_acceptances/);
  assert.match(source, /addLocalAcceptance/);

  const localBranchStart = source.indexOf("if (!backendDatabase.enabled)");
  const dbInsertIndex = source.indexOf("INSERT INTO legal_acceptances");
  assert.ok(localBranchStart >= 0 && dbInsertIndex > localBranchStart);
});

test("sanidad catalogo base", () => {
  const active = latestActiveLegalDocuments(LEGAL_DOCUMENTS_BASE);
  assert.ok(active.length >= 10);
  const required = active.filter((item) => item.requiredBeforePayment);
  assert.ok(required.length >= 1);
  const slugs = new Set(active.map((item) => item.slug));
  assert.equal(slugs.size, active.length);

  const sample = findBySlug(active, "terminos-condiciones");
  assert.equal(sample.length, 1);
});
