const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

test("Mission UI has isolated renderers for Presence and High Ticket", () => { const highTicketRenderer = source.slice(source.indexOf("function renderHighTicketIntelligence"), source.indexOf("function renderMissionResult")); assert.match(source, /function renderPresenceIntelligence/); assert.match(highTicketRenderer, /High Ticket|Diagnóstico Digital|Hipóteses de oportunidade|Perguntas para validar/); assert.doesNotMatch(highTicketRenderer, /Uneed Presença|39€|sem fidelização|simulação personalizada|ready_for_contact/); });

test("High Ticket renderer hides internal categories, confidence and evidence IDs", () => { const highTicketRenderer = source.slice(source.indexOf("function renderHighTicketIntelligence"), source.indexOf("function renderMissionResult")); const impactFormatter = source.slice(source.indexOf("function renderHighTicketImpact"), source.indexOf("function renderPresenceIntelligence")); assert.match(highTicketRenderer, /item\?\.statement/); assert.match(impactFormatter, /item\?\.impact/); assert.doesNotMatch(`${impactFormatter}${highTicketRenderer}`, /evidenceIds|item\?\.category|item\?\.confidence/); });

test("legacy generic High Ticket research is rerun with the contextual quality version", () => { assert.match(source, /function isLegacyHighTicketResearch/); assert.match(source, /high-ticket-context-v0\.2/); assert.match(source, /!isLegacyHighTicketResearch\(existingMission\)/); });

test("contact summary preserves stage dates and shows demonstration independently", () => {
  const vm = require("node:vm");
  const start = source.indexOf("const prospectStageLabels");
  const end = source.indexOf("function renderProspectContactRecords", start);
  const context = vm.createContext({});
  vm.runInContext(source.slice(start, end), context);
  const lead = { status: "Follow up WhatsApp", contactRecords: { "Mensagem IG enviada": { date: "2026-09-15", channel: "Telefone" }, "Follow up WhatsApp": { date: "2026-09-18", channel: "Email" } }, demonstration: { status: "Enviada", date: "2026-09-16" } };
  assert.equal(context.prospectContactSummary(lead), "18/09/2026 · Email · Demonstração: Enviada · 16/09/2026");
  lead.status = "Mensagem IG enviada";
  assert.match(context.prospectContactSummary(lead), /^15\/09\/2026 · Telefone/);
  assert.equal(context.prospectContactSummary({ status: "Mensagem IG enviada" }), "Contacto por registar");
});

test("deleting a Kanban lead also hides its Missions from Command Center", () => { assert.match(source, /state\.deletedMissionTargetIds/); assert.match(source, /visibleMissions = missions\.filter/); assert.match(source, /missions = missions\.filter\(\(item\) => item\.targetId !== leadId\)/); });

test("mockup action prepares a reusable ChatGPT image prompt instead of rendering locally", () => { assert.match(source, /generatedMockupPrompt: prompt/); assert.match(source, /Entrega apenas a imagem final do mockup/); assert.match(source, /copyMockupPromptBtn/); });

test("prospecting cards are collapsed by default and expose details on demand", () => { assert.match(source, /<details class="deal-card prospect-card prospect-card-collapsible"/); assert.match(source, /<summary class="deal-summary">/); assert.match(source, /prospect-card-chevron/); assert.doesNotMatch(source, /<details class="deal-card prospect-card prospect-card-collapsible"[^>]* open/); });

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
