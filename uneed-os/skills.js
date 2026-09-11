const OUTREACH_POLICY = Object.freeze({ id: "uneed-outreach", version: "1.0.0", rules: ["linguagem humana, curta e cordial", "usar apenas factos ou observações seguras", "sem crítica agressiva ou linguagem de IA", "solução relevante do catálogo", "CTA simples"] });
const SCORING = Object.freeze({ version: "1.0.0", weights: { digitalGap: 30, businessFit: 30, reachable: 20, likelyNeed: 20 } });

const versions = {
  "research-company": [
    { id: "research-company", name: "Investigar negócio", version: "1.0.0", status: "historical", requiredCapabilities: ["structured_output"], allowedTools: ["read_crm"], instructions: "Organiza apenas dados CRM; separa factos e inferências." },
    { id: "research-company", name: "Investigar empresa", version: "1.1.0", status: "active", requiredCapabilities: ["structured_reasoning", "web_context_analysis", "structured_output"], allowedTools: ["read_crm","search_web","inspect_website","fetch_public_page","discover_social_profiles"], instructions: "Constrói um Research Pack evidence-first. Nunca preencher um campo por parecer provável; usar unknown quando não confirmado." },
  ],
  "qualify-lead": [
    { id: "qualify-lead", name: "Qualificar oportunidade", version: "1.0.0", status: "historical", requiredCapabilities: ["structured_reasoning","structured_output"], allowedTools: ["read_crm"], instructions: "Avalia usando dados CRM." },
    { id: "qualify-lead", name: "Qualificar oportunidade", version: "1.1.0", status: "active", requiredCapabilities: ["structured_reasoning","structured_output"], allowedTools: ["read_crm"], config: { scoring: SCORING }, instructions: "Consome o CompanyResearchPack. Explica cada parcela do score; não trates inferências como factos e recomenda apenas itens do catálogo recebido." },
  ],
  "prepare-outreach": [
    { id: "prepare-outreach", name: "Preparar abordagem", version: "1.0.0", status: "historical", requiredCapabilities: ["structured_output"], allowedTools: ["read_crm"], instructions: "Prepara mensagem sem enviar." },
    { id: "prepare-outreach", name: "Preparar abordagem", version: "1.1.0", status: "active", requiredCapabilities: ["structured_output"], allowedTools: ["read_crm"], config: { outreachPolicy: OUTREACH_POLICY }, instructions: `Segue a política ${OUTREACH_POLICY.id}@${OUTREACH_POLICY.version}: ${OUTREACH_POLICY.rules.join("; ")}. Nunca envia a mensagem.` },
  ],
};

const OUTPUT_FIELDS = Object.freeze({
  "research-company": ["schemaVersion","companyIdentity","knownData","businessSummary","digitalPresence","websiteSignals","facts","observations","inferences","opportunities","evidence","unknowns","confidence","researchedAt"],
  "qualify-lead": ["score","breakdown","opportunityLevel","observations","digitalPresence","problemsDetected","potentialNeeds","recommendedService","reasoningSummary","confidence"],
  "prepare-outreach": ["suggestedApproach","preparedMessage","recommendationReason","evidenceUsed"],
});

function getSkill(id, version) { const candidates = versions[id]; if (!candidates) throw new Error(`unknown_skill:${id}`); const skill = version ? candidates.find((item) => item.version === version) : candidates.find((item) => item.status === "active"); if (!skill) throw new Error(`unknown_skill_version:${id}@${version}`); return skill; }
function listSkills({ includeHistorical = false } = {}) { return Object.values(versions).flatMap((items) => includeHistorical ? items : items.filter((item) => item.status === "active")); }
function validateSkillOutput(id, output, version = "1.1.0") { if (!output || typeof output !== "object") return false; if (version === "1.0.0") { if (id === "research-company") return Array.isArray(output.facts) && Array.isArray(output.sources); if (id === "qualify-lead") return Number.isFinite(output.score) && Number.isFinite(output.confidence); return typeof output.preparedMessage === "string"; } if (!OUTPUT_FIELDS[id]?.every((field) => Object.hasOwn(output, field))) return false; if (id === "research-company") return Array.isArray(output.evidence) && Array.isArray(output.unknowns) && ["low","medium","high"].includes(output.confidence); if (id === "qualify-lead") return Number.isFinite(output.score) && output.score >= 0 && output.score <= 100 && output.breakdown && Number.isFinite(output.confidence); return typeof output.preparedMessage === "string" && Array.isArray(output.evidenceUsed); }

module.exports = { getSkill, listSkills, validateSkillOutput, OUTPUT_FIELDS, SCORING, OUTREACH_POLICY };
