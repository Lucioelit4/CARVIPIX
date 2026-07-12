async function run() {
  const baseUrl = process.env.CARVIPIX_BASE_URL?.trim() || "http://localhost:3000";
  const adminCookie = process.env.CARVIPIX_ADMIN_COOKIE?.trim();

  if (!adminCookie) {
    console.error("Missing CARVIPIX_ADMIN_COOKIE for admin seed request");
    process.exitCode = 1;
    return;
  }

  try {
    const response = await fetch(`${baseUrl}/api/admin/payments/paypal/seed`, {
      method: "POST",
      headers: {
        Cookie: adminCookie,
      },
    });

    const result = (await response.json().catch(() => ({}))) as unknown;
    if (!response.ok) {
      console.error(JSON.stringify(result, null, 2));
      process.exitCode = 1;
      return;
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : "seedPayPalCatalog failed";
    console.error(message);
    process.exitCode = 1;
  }
}

void run();
