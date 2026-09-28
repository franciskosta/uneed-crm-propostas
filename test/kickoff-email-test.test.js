const test = require("node:test");
const assert = require("node:assert/strict");

const { sameSecret } = require("../api/kickoff-email-test");

test("temporary SMTP test compares its bearer token safely", () => {
  assert.equal(sameSecret("correct-token", "correct-token"), true);
  assert.equal(sameSecret("wrong-token", "correct-token"), false);
  assert.equal(sameSecret("", ""), false);
  assert.equal(sameSecret("short", "longer"), false);
});
