import test from "node:test";
import assert from "node:assert/strict";

import { isInternalOwnerEmail } from "./owner-access-config";

test("recognizes default internal owner emails", () => {
  assert.equal(isInternalOwnerEmail("salcidoabraham525@gmail.com"), true);
  assert.equal(isInternalOwnerEmail("ymiler94@gmail.com"), true);
  assert.equal(isInternalOwnerEmail("YMILER94@GMAIL.COM"), true);
  assert.equal(isInternalOwnerEmail("otro@correo.com"), false);
});