const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

test("approval controls remain stable while a Mission waits for Francisco", () => {
  assert.match(source, /activeMission\.status !== "waiting_approval"/);
  assert.match(source, /type="button" data-mission-decision="approve"/);
  assert.match(source, /type="button" data-mission-decision="reject"/);
});

test("approval interaction displays progress and sends the decision", () => {
  assert.match(source, /A registar aprovação/);
  assert.match(source, /missionApi\(`\/\$\{id\}\/decision`/);
  assert.match(source, /JSON\.stringify\(\{ approved \}\)/);
});
