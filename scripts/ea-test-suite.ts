/**
 * CARVIPIX EA Testing Suite
 * Uses native fetch (Node.js 18+)
 */

const API_BASE = process.env.API_URL || "http://localhost:3000";

interface TestResult {
  test: string;
  status: "PASS" | "FAIL";
  duration: number;
  error?: string;
}

class EATestSuite {
  private results: TestResult[] = [];
  private testLicenseId = "";
  private testInstallationId = "";
  private testSignalId = "";

  async runAllTests() {
    console.log("\n CARVIPIX EA TEST SUITE\n");
    console.log("=".repeat(50));

    await this.test_CreateLicense();
    await this.test_ValidateLicense();
    await this.test_Handshake();
    await this.test_FetchSignal();
    await this.test_DisconnectEA();

    this.printResults();
  }

  private async test_CreateLicense() {
    const start = Date.now();
    try {
      const response = await fetch(API_BASE + "/api/admin/bot/mt5/licenses/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_tier: "PRO", max_installations: 5, expires_in_days: 30 }),
      });
      const data = await response.json() as { license_id?: string };
      this.testLicenseId = data.license_id || "";

      this.results.push({ test: "Create License", status: response.ok ? "PASS" : "FAIL", duration: Date.now() - start });
      console.log((response.ok ? "PASS" : "FAIL") + " Create License: " + this.testLicenseId);
    } catch (error) {
      this.results.push({ test: "Create License", status: "FAIL", duration: Date.now() - start, error: String(error) });
      console.error("FAIL Create License:", error);
    }
  }

  private async test_ValidateLicense() {
    const start = Date.now();
    try {
      const response = await fetch(API_BASE + "/api/bot/mt5/validate-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ license_id: this.testLicenseId }),
      });

      this.results.push({ test: "Validate License", status: response.ok ? "PASS" : "FAIL", duration: Date.now() - start });
      console.log((response.ok ? "PASS" : "FAIL") + " Validate License");
    } catch (error) {
      this.results.push({ test: "Validate License", status: "FAIL", duration: Date.now() - start, error: String(error) });
    }
  }

  private async test_Handshake() {
    const start = Date.now();
    try {
      this.testInstallationId = "INST-TEST-" + Date.now();

      const response = await fetch(API_BASE + "/api/bot/mt5/handshake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license_id: this.testLicenseId,
          installation_id: this.testInstallationId,
          account_hash: "ACC-TEST",
          broker: "OANDA",
          server: "live",
          magic_number: 123456789,
        }),
      });

      this.results.push({ test: "Handshake", status: response.ok ? "PASS" : "FAIL", duration: Date.now() - start });
      console.log((response.ok ? "PASS" : "FAIL") + " Handshake");
    } catch (error) {
      this.results.push({ test: "Handshake", status: "FAIL", duration: Date.now() - start, error: String(error) });
    }
  }

  private async test_FetchSignal() {
    const start = Date.now();
    try {
      const response = await fetch(
        API_BASE + "/api/bot/mt5/signal/next?installation_id=" + this.testInstallationId + "&account_hash=ACC-TEST"
      );

      this.results.push({ test: "Fetch Signal", status: response.ok ? "PASS" : "FAIL", duration: Date.now() - start });
      console.log((response.ok ? "PASS" : "FAIL") + " Fetch Signal");
    } catch (error) {
      this.results.push({ test: "Fetch Signal", status: "FAIL", duration: Date.now() - start, error: String(error) });
    }
  }

  private async test_DisconnectEA() {
    const start = Date.now();
    try {
      const response = await fetch(API_BASE + "/api/bot/mt5/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installation_id: this.testInstallationId }),
      });

      this.results.push({ test: "Disconnect", status: response.ok ? "PASS" : "FAIL", duration: Date.now() - start });
      console.log((response.ok ? "PASS" : "FAIL") + " Disconnect");
    } catch (error) {
      this.results.push({ test: "Disconnect", status: "FAIL", duration: Date.now() - start, error: String(error) });
    }
  }

  private printResults() {
    const passed = this.results.filter((r) => r.status === "PASS").length;
    const failed = this.results.filter((r) => r.status === "FAIL").length;

    console.log("\n=".repeat(50));
    console.log("Summary: " + passed + " PASS, " + failed + " FAIL");

    if (failed === 0) {
      console.log("ALL TESTS PASSED!");
    }
  }
}

const suite = new EATestSuite();
suite.runAllTests().catch(console.error);