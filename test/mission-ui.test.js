const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

test("Mission UI has isolated renderers for Presence and High Ticket", () => { const highTicketRenderer = source.slice(source.indexOf("function renderHighTicketIntelligence"), source.indexOf("function renderMissionResult")); assert.match(source, /function renderPresenceIntelligence/); assert.match(highTicketRenderer, /High Ticket|Diagnóstico Digital|Hipóteses de oportunidade|Perguntas para validar/); assert.doesNotMatch(highTicketRenderer, /Uneed Presença|39€|sem fidelização|simulação personalizada|ready_for_contact/); });

test("High Ticket renderer hides internal categories, confidence and evidence IDs", () => { const highTicketRenderer = source.slice(source.indexOf("function renderHighTicketIntelligence"), source.indexOf("function renderMissionResult")); const impactFormatter = source.slice(source.indexOf("function renderHighTicketImpact"), source.indexOf("function renderPresenceIntelligence")); assert.match(highTicketRenderer, /item\?\.statement/); assert.match(impactFormatter, /item\?\.impact/); assert.doesNotMatch(`${impactFormatter}${highTicketRenderer}`, /evidenceIds|item\?\.category|item\?\.confidence/); });

test("legacy generic High Ticket research is rerun with the contextual quality version", () => { assert.match(source, /function isLegacyHighTicketResearch/); assert.match(source, /high-ticket-context-v0\.2/); assert.match(source, /!isLegacyHighTicketResearch\(existingMission\)/); });

test("approval controls remain stable while a Mission waits for Francisco", () => {
  assert.match(source, /activeMission\.status !== "waiting_approval"/);
  assert.match(source, /type="button" data-mission-decision="approve"/);
  assert.match(source, /type="button" data-mission-decision="reject"/);
});

test("approval interaction displays progress and sends the decision", () => {
  assert.match(source, /A registar aprovação/);
  assert.match(source, /missionActionApi\(id, "decision", \{ approved \}\)/);
  assert.match(source, /\/api\/mission-action/);
});
