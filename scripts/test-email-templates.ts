import {
  createWelcomeRegistrationTemplate,
  createPasswordRecoveryTemplate,
  createFoundersProgramWelcomeTemplate,
  createBotLicensePurchasedTemplate,
  createSupportTicketResolvedTemplate,
  type EmailTemplate,
} from "@/app/backend/notifications/professional-templates";

async function testEmailTemplates() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  PRUEBA E2E: SISTEMA DE CORREOS CARVIPIX                   ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("");

  const tests: Array<{
    name: string;
    fn: () => EmailTemplate;
    validations: Array<(t: EmailTemplate) => boolean>;
  }> = [
    {
      name: "Template: Bienvenida al Registro",
      fn: () =>
        createWelcomeRegistrationTemplate({
          name: "Juan Pérez",
          verificationUrl: "https://carvipix.com/verificar?token=abc123",
          supportEmail: "support@carvipix.com",
          appUrl: "https://carvipix.com",
        }),
      validations: [
        (t) => t.subject.includes("CARVIPIX"),
        (t) => t.subject.includes("Confirma"),
        (t) => t.html.includes("Juan Pérez"),
        (t) => t.html.includes("verificar-correo"),
        (t) => t.html.includes("D4AF37"), // Color corporativo
        (t) => t.text.includes("https://carvipix.com/verificar"),
      ],
    },
    {
      name: "Template: Recuperación de Contraseña",
      fn: () =>
        createPasswordRecoveryTemplate({
          name: "María García",
          resetUrl: "https://carvipix.com/reset?token=xyz789",
          supportEmail: "support@carvipix.com",
          appUrl: "https://carvipix.com",
        }),
      validations: [
        (t) => t.subject.includes("CARVIPIX"),
        (t) => t.subject.includes("Contraseña"),
        (t) => t.html.includes("María García"),
        (t) => t.html.includes("30 minutos"),
        (t) => t.html.includes("🔐"),
        (t) => t.text.includes("30 minutos"),
      ],
    },
    {
      name: "Template: Programa Fundadores",
      fn: () =>
        createFoundersProgramWelcomeTemplate({
          name: "Carlos López",
          benefits: [
            "Acceso prioritario a nuevas funciones",
            "Soporte dedicado 24/7",
            "Descuentos especiales",
          ],
          expiryDate: "14 de Octubre de 2026",
          supportEmail: "support@carvipix.com",
          appUrl: "https://carvipix.com",
          telegramUrl: "https://t.me/carvipix_private",
        }),
      validations: [
        (t) => t.subject.includes("Fundadores"),
        (t) => t.html.includes("Carlos López"),
        (t) => t.html.includes("Acceso prioritario"),
        (t) => t.html.includes("14 de Octubre de 2026"),
        (t) => t.html.includes("🌟"),
        (t) => t.text.includes("Beneficios"),
      ],
    },
    {
      name: "Template: Bot License Comprado",
      fn: () =>
        createBotLicensePurchasedTemplate({
          name: "Roberto Silva",
          orderId: "ORD-2026-07-001",
          licenseCode: "CRVP-BOT-2026-XYZ123",
          downloadUrl: "https://carvipix.com/download/bot",
          manualUrl: "https://carvipix.com/docs/bot-manual",
          supportEmail: "licenses@carvipix.com",
          appUrl: "https://carvipix.com",
        }),
      validations: [
        (t) => t.subject.includes("CARVIPIX"),
        (t) => t.subject.includes("Bot"),
        (t) => t.html.includes("Roberto Silva"),
        (t) => t.html.includes("ORD-2026-07-001"),
        (t) => t.html.includes("CRVP-BOT-2026-XYZ123"),
        (t) => t.html.includes("Descargar"),
        (t) => t.text.includes("MetaTrader"),
      ],
    },
    {
      name: "Template: Ticket de Soporte Resuelto",
      fn: () =>
        createSupportTicketResolvedTemplate({
          name: "Angela Martínez",
          ticketId: "TKT-2026-000123",
          resolution:
            "Tu problema fue causado por una configuración incorrecta. Hemos actualizado tu sesión y ahora funciona correctamente.",
          supportEmail: "support@carvipix.com",
          appUrl: "https://carvipix.com",
        }),
      validations: [
        (t) => t.subject.includes("CARVIPIX"),
        (t) => t.subject.includes("resuelto"),
        (t) => t.html.includes("Angela Martínez"),
        (t) => t.html.includes("TKT-2026-000123"),
        (t) => t.html.includes("configuración incorrecta"),
        (t) => t.html.includes("✓"),
      ],
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n🧪 ${test.name}`);
    console.log("-".repeat(60));

    try {
      const template = test.fn();

      // Validaciones
      let testPassed = true;
      for (let i = 0; i < test.validations.length; i++) {
        const validation = test.validations[i];
        try {
          const result = validation(template);
          if (!result) {
            console.log(`   ❌ Validación ${i + 1} falló`);
            testPassed = false;
          }
        } catch (e) {
          console.log(`   ❌ Validación ${i + 1} error: ${e}`);
          testPassed = false;
        }
      }

      // Métricas
      const htmlSize = template.html.length;
      const textSize = template.text.length;
      const ctaCount = (template.html.match(/href="/g) || []).length;

      console.log(`   ✅ Plantilla generada correctamente`);
      console.log(`      Subject: ${template.subject.substring(0, 50)}...`);
      console.log(`      HTML: ${htmlSize} bytes`);
      console.log(`      Text: ${textSize} bytes`);
      console.log(`      CTAs: ${ctaCount}`);
      console.log(`      Preheader: ${template.preheader.substring(0, 40)}...`);

      if (testPassed) {
        console.log(`   ✅ ${test.validations.length} validaciones pasadas`);
        passed++;
      } else {
        console.log(`   ⚠️  Algunas validaciones fallaron`);
        failed++;
      }
    } catch (error) {
      console.log(
        `   ❌ Error al generar plantilla: ${error instanceof Error ? error.message : error}`
      );
      failed++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 RESULTADOS:`);
  console.log(`   ✅ Pasadas: ${passed}/${tests.length}`);
  console.log(`   ❌ Fallidas: ${failed}/${tests.length}`);
  console.log("");

  if (failed === 0) {
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║  ✅ TODAS LAS PRUEBAS PASARON                             ║");
    console.log("║  El sistema de plantillas está listo para producción      ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    process.exit(0);
  } else {
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log(`║  ⚠️  ${failed} pruebas fallaron                              ║`);
    console.log("║  Revisa los errores arriba                                ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    process.exit(1);
  }
}

testEmailTemplates().catch((error) => {
  console.error("Error fatal en pruebas:", error);
  process.exit(1);
});
