import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sourcePath = new URL("./CARVIPIX_EA_MT5_V1.mq5", import.meta.url);

test("EA validates modern signature, BUY/SELL risk, broker retcode and terminal ACKs", async () => {
  const source = await readFile(sourcePath, "utf8");

  assert.match(source, /StringFind\(signal\.signature, "SHA256:"\) == 0/);
  assert.match(source, /StringLen\(signal\.signature\) == 71/);
  assert.equal((source.match(/MathAbs\(signal\.entry - signal\.stop_loss\)/g) ?? []).length, 2);
  assert.match(source, /result\.retcode == TRADE_RETCODE_DONE \|\| result\.retcode == TRADE_RETCODE_DONE_PARTIAL/);
  assert.match(source, /if \(!sent \|\| !broker_accepted\)/);
  assert.match(source, /SendACK\(signal\.signal_id, "EXECUTION_FAILED"\)/);
  assert.match(source, /SendACK\(signal\.signal_id, "EXECUTED"\)/);
  assert.match(source, /ReportExecution\(signal, result, "FAILED"\)/);
  assert.match(source, /ReportExecution\(signal, result, "EXECUTED"\)/);
});