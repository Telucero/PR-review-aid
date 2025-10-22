const inputItems = this.getInputData();

// --- Config ---
const MIN_SIMILARITY = 0.85; // drop comments if match < this
const USE_ITEM_STYLE_GUIDE_FIRST = true;

// --- Session / globals ---
const sessionId = inputItems?.[0]?.json?.sessionId || "default-session";
const userMessage =
  inputItems?.[0]?.json?.chatInput ||
  inputItems?.[0]?.json?.message ||
  inputItems?.[0]?.json?.content ||
  "No input provided";

// Prefer per-item style_guide; fallback to first item or empty
const firstGuide = inputItems?.[0]?.json?.style_guide || "";
const decodedContent = USE_ITEM_STYLE_GUIDE_FIRST ? firstGuide : (firstGuide || "");
const MAX_MEMORY_CHARS = 4000;

// --- Logging helper ---
const logStatus = (status, progress, details) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${status} (${progress}%) - ${details}`);
};

logStatus("START", 5, "Loading model");

// --- Model connections ---
const memoryData = await this.getInputConnectionData("ai_memory", 0).catch(() => []);
const memoryContextRaw = extractMemoryContext(memoryData);
const memoryBlock = memoryContextRaw
  ? `
ADDITIONAL MEMORY CONTEXT:
"""
${memoryContextRaw}
"""
`
  : "";
const models = await this.getInputConnectionData('ai_languageModel', 0);
if (!models || models.length === 0) throw new Error("Language model not connected or not enabled");
const model = models[0];

logStatus("Model loaded", 10, `Model: ${model.modelName}`);

const outputParsers = await this.getInputConnectionData('ai_outputParser', 0);
if (!outputParsers || outputParsers.length === 0) throw new Error("No output parser connected");
const outputParser = outputParsers[0];

// --- Text utils ---
function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/```suggestion[\s\S]*?```/g, m => m.replace(/```suggestion|```/g, ""))
    .replace(/```[\s\S]*?```/g, m => m.replace(/```/g, ""))
    .replace(/`+/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function simpleSimilarity(a, b) {
  if (!a || !b) return 0;
  a = normalize(a);
  b = normalize(b);
  if (!a && !b) return 1;
  if (a === b) return 1;
  if (a && b && (a.includes(b) || b.includes(a))) return 0.95;
  return 0;
}

function isBlankContent(s) {
  return s === "\n" || /^\s*$/.test(String(s || ""));
}

function getAdditionalInputItems(ctx, index) {
  if (typeof ctx.getInputData !== "function") return [];
  try {
    const data = ctx.getInputData(index);
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return [];
  } catch {
    return [];
  }
}

async function getStyleGuideTableItems(ctx) {
  const directItems = getAdditionalInputItems(ctx, 1);
  if (directItems.length) return directItems;

  if (typeof ctx.getInputConnectionData === "function") {
    try {
      const toolConnections = await ctx.getInputConnectionData("ai_tool", 0);
      if (Array.isArray(toolConnections) && toolConnections.length) {
        const collected = [];
        for (const entry of toolConnections) {
          if (!entry) continue;
          const payload = entry.result ?? entry.json ?? entry;
          if (!payload) continue;
          const candidates =
            payload.entries ?? payload.rows ?? payload.data ?? payload.items ?? [];
          if (Array.isArray(candidates) && candidates.length) {
            for (const row of candidates) {
              collected.push({ json: row });
            }
          }
        }
        if (collected.length) return collected;
      }
    } catch (err) {
      console.warn("Unable to load style guide rows from ai_tool connection:", err?.message ?? err);
    }
  }

  return [];
}

function stringifyMessageContent(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object") {
          if (typeof part.text === "string") return part.text;
          if (typeof part.content === "string") return part.content;
          if (Array.isArray(part.content)) return stringifyMessageContent(part.content);
        }
        return JSON.stringify(part);
      })
      .filter(Boolean)
      .join(" ");
  }
  if (content && typeof content === "object") {
    if (typeof content.text === "string") return content.text;
    if (typeof content.content === "string") return content.content;
    if (Array.isArray(content.content)) return stringifyMessageContent(content.content);
  }
  try {
    return JSON.stringify(content);
  } catch {
    return String(content);
  }
}

function collectMessagesFromArray(messages, lines) {
  if (!Array.isArray(messages)) return;
  for (const message of messages) {
    if (!message || typeof message !== "object") continue;
    const role = message.role || message.type || "message";
    const text = stringifyMessageContent(message.content ?? message.text ?? message.value ?? "");
    if (text) {
      lines.push(`${role.toUpperCase()}: ${text}`);
    }
  }
}

function extractMemoryContext(memoryItems) {
  if (!Array.isArray(memoryItems) || !memoryItems.length) return "";
  const lines = [];

  for (const entry of memoryItems) {
    const data = (entry && entry.json) ? entry.json : entry;
    if (!data) continue;

    if (typeof data === "string") {
      lines.push(data);
      continue;
    }

    if (Array.isArray(data.messages)) {
      collectMessagesFromArray(data.messages, lines);
    }
    if (data.memory) {
      if (Array.isArray(data.memory.messages)) {
        collectMessagesFromArray(data.memory.messages, lines);
      }
      if (typeof data.memory.buffer === "string") {
        lines.push(data.memory.buffer);
      }
    }
    if (Array.isArray(data.history)) {
      collectMessagesFromArray(data.history, lines);
    }
    if (Array.isArray(data.buffer)) {
      lines.push(
        data.buffer
          .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
          .join("\n")
      );
    }
    if (!Array.isArray(data.messages) && !data.memory && !data.history && !data.buffer) {
      try {
        lines.push(JSON.stringify(data));
      } catch {
        lines.push(String(data));
      }
    }
  }

  const memoryText = lines.filter(Boolean).join("\n");
  if (memoryText.length > MAX_MEMORY_CHARS) {
    return `${memoryText.slice(0, MAX_MEMORY_CHARS)}\n…`;
  }
  return memoryText;
}

function buildStyleGuideSectionData(items) {
  const sectionMap = new Map();
  const sectionNames = [];
  for (const entry of items) {
    const row = (entry && entry.json) ? entry.json : entry;
    if (!row || typeof row !== "object") continue;
    const sectionRaw =
      row.Section ??
      row.Sections ??
      row.section ??
      row.section_name ??
      row["Section"] ??
      row["Sections"] ??
      "";
    const section = String(sectionRaw || "").trim();
    if (!section) continue;
    if (!sectionMap.has(section)) {
      sectionMap.set(section, []);
      sectionNames.push(section);
    }
    sectionMap.get(section).push(row);
  }
  return { sectionMap, sectionNames };
}

const SECTION_SYNONYMS = {
  "language": "Language and Tone",
  "tone": "Language and Tone",
  "language and tone": "Language and Tone",
  "clarity and specificity": "Clarity and Specificity",
  "accessibility": "Accessibility and Inclusion",
  "terminology": "Terminology and Capitalization",
  "capitalization": "Terminology and Capitalization",
  "punctuation": "Punctuation and Sentence Structure",
  "sentence structure": "Punctuation and Sentence Structure",
  "text formatting": "Text Formatting",
  "formatting": "Text Formatting",
  "links": "Links",
  "hyperlinks": "Links",
  "code": "Code Guidelines",
  "code guidelines": "Code Guidelines",
  "variable conventions": "Code Guidelines",
  "terminal": "Terminal Content",
  "terminal content": "Terminal Content",
  "structure": "Structure Guidelines",
  "repository structure": "Structure Guidelines",
  "page structure": "Structure Guidelines",
  "visual": "Visual Assets",
  "images": "Visual Assets",
  "diagrams": "Visual Assets",
  "screenshots": "Visual Assets",
  "tables": "Table Formatting",
  "table formatting": "Table Formatting",
  "lists": "List Formatting",
  "list formatting": "List Formatting",
  "list": "List Formatting",
  "exceptions": "Exception Reference",
  "client exceptions": "Exception Reference",
  "page structure": "Page Structure",
  "page strcuture": "Page Structure",
  "quotes": "Quotes",
  "text formatting": "Text Formatting",
  "terminology and capitalization": "Terminology and Capitalization",
  "chicago heading style rules": "Chicago Heading Style Rules",
  "prohibited": "Prohibited",
  "informal and formal": "Informal and Formal"
};

function resolveSectionName(candidate, sectionNames) {
  if (!candidate) return null;
  const lower = candidate.toLowerCase();
  for (const actual of sectionNames) {
    if (actual.toLowerCase() === lower) return actual;
  }
  const synonymTarget = SECTION_SYNONYMS[lower];
  if (synonymTarget) {
    const match = sectionNames.find(
      (name) => name.toLowerCase() === synonymTarget.toLowerCase()
    );
    if (match) return match;
  }
  for (const [key, target] of Object.entries(SECTION_SYNONYMS)) {
    if (lower.includes(key)) {
      const match = sectionNames.find(
        (name) => name.toLowerCase() === target.toLowerCase()
      );
      if (match) return match;
    }
  }
  return (
    sectionNames.find(
      (name) =>
        name.toLowerCase().includes(lower) || lower.includes(name.toLowerCase())
    ) || null
  );
}

function determineDocContext(filename, meta = {}) {
  const lowerFilename = String(filename || "").toLowerCase();
  const docTypeRaw =
    meta.doc_type ||
    meta.documentType ||
    meta.document_type ||
    (meta.frontmatter && (meta.frontmatter.type || meta.frontmatter.doc_type)) ||
    "";
  const docType = String(docTypeRaw || "").toLowerCase();
  const tutorialPattern = /(tutorial|getting-started|quickstart|walkthrough|how-to)/;
  const isTutorial = tutorialPattern.test(docType) || tutorialPattern.test(lowerFilename);
  const langRegister = isTutorial ? "informal" : "formal";
  const docTags = new Set(["all", "general", "documentation"]);
  if (docType) docTags.add(docType);
  if (isTutorial) {
    docTags.add("tutorial");
    docTags.add("guide");
    docTags.add("how-to");
    docTags.add("walkthrough");
  } else {
    docTags.add("reference");
    docTags.add("concept");
    docTags.add("guide");
  }
  return { langRegister, docTags };
}

function normalizeList(value) {
  if (!value) return [];
  if (Array.isArray(value))
    return value.map((v) => String(v || "").toLowerCase().trim()).filter(Boolean);
  return String(value || "")
    .toLowerCase()
    .split(/[,/|]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function rowMatchesContext(row, registerTags, docTags) {
  const rawRegisters = normalizeList(
    row.Lang_register || row.lang_register || row.register
  );
  const registerValues = rawRegisters.map((value) => {
    if (value === "formal speech" || value === "formal tone") return "formal";
    if (value === "informal speech" || value === "informal tone") return "informal";
    if (value === "both") return "both";
    return value;
  });
  const rawDocs = normalizeList(row.Documentation || row.documentation || row.docs);
  const docValues = rawDocs.map((value) => {
    if (value.endsWith("s") && docTags.has(value.slice(0, -1))) {
      return value.slice(0, -1);
    }
    return value;
  });
  const registerOk =
    registerValues.length === 0 ||
    registerValues.some((value) => registerTags.has(value) || value === "both");
  const docOk =
    docValues.length === 0 ||
    docValues.some((value) => docTags.has(value) || value === "all");
  return registerOk && docOk;
}

function formatSectionContent(sectionName, rows) {
  if (!rows.length) return "";
  const formatted = rows
    .map((row) => {
      const rule = row.Rules || row.Rule || row.rule || "";
      const explanation = row.Explanation || row.explanation || "";
      const goodExample =
        row["Good Examples"] ||
        row.goodExamples ||
        row.good_examples ||
        row.example ||
        "";
      const mistake =
        row["Mistake to avoid"] ||
        row["Mistakes to avoid"] ||
        row.mistake ||
        row.mistakes ||
        "";
      const docs = row.Documentation || row.documentation || "";
      const parts = [];
      if (rule) parts.push(`- **Rule:** ${rule}`);
      if (explanation) parts.push(`  - Why: ${explanation}`);
      if (goodExample) parts.push(`  - Example: ${goodExample}`);
      if (mistake) parts.push(`  - Avoid: ${mistake}`);
      if (docs) parts.push(`  - Documentation: ${docs}`);
      return parts.join("\n");
    })
    .filter(Boolean)
    .join("\n");
  if (!formatted) return "";
  return `### ${sectionName}\n${formatted}`;
}

const SECTION_PROCESS_ORDER = [
  "Code Guidelines",
  "List",
  "Clarity and Specificity",
  "Terminal Content",
  "Page Structure",
  "Quotes",
  "Text Formatting",
  "Links",
  "Terminology and Capitalization",
  "Chicago Heading Style Rules",
  "Punctuation and Sentence Structure",
  "Prohibited",
  "Accessibility and Inclusion",
  "Informal and Formal"
];

function composeStyleGuide(baseGuide, sectionData, context) {
  if (!sectionData || sectionData.sectionMap.size === 0) {
    return { guideText: baseGuide, sectionsUsed: [] };
  }

  const registerTags = new Set(["both", context.langRegister || "formal"]);
  const docTags = context.docTags || new Set(["all", "general", "documentation"]);
  const sectionsUsed = [];
  const formattedSections = [];

  for (const sectionKey of SECTION_PROCESS_ORDER) {
    const resolved = resolveSectionName(sectionKey, sectionData.sectionNames);
    if (!resolved || sectionsUsed.includes(resolved)) continue;
    const rows = (sectionData.sectionMap.get(resolved) || []).filter((row) =>
      rowMatchesContext(row, registerTags, docTags)
    );
    if (!rows.length) continue;
    const sectionContent = formatSectionContent(resolved, rows);
    if (!sectionContent) continue;
    sectionsUsed.push(resolved);
    formattedSections.push(sectionContent);
  }

  if (!formattedSections.length) {
    return { guideText: "", sectionsUsed: [] };
  }

  for (const remaining of sectionData.sectionNames) {
    if (sectionsUsed.includes(remaining)) continue;
    const rows = (sectionData.sectionMap.get(remaining) || []).filter((row) =>
      rowMatchesContext(row, registerTags, docTags)
    );
    if (!rows.length) continue;
    const sectionContent = formatSectionContent(remaining, rows);
    if (!sectionContent) continue;
    sectionsUsed.push(remaining);
    formattedSections.push(sectionContent);
  }

  const targetedGuide = `## Targeted Style Rules\n${formattedSections.join("\n\n")}`;
  return { guideText: targetedGuide, sectionsUsed };
}

const styleGuideTableItems = await getStyleGuideTableItems(this);
const styleGuideSectionData = buildStyleGuideSectionData(styleGuideTableItems);

const outputItems = [];

let progress = 20;
let totalRuns = 0;
let toolUseCount = 0;
let structuredOutputCount = 0;

// Process each file item
for (const item of inputItems) {
  const j = (item && item.json) ? item.json : {};
  const {
    filename,
    file: fileFromInput,              // ✅ passthrough from input
    status: fileGitStatus,            // may also be present
    raw_url,
    patch,
    fileIndex,
    style_guide: itemStyleGuide,
    charCount: inCharCount,
    combinedCharCount: inCombined,
    added_lines = [],
    removed_lines = [],
    context_lines = [],
  } = j;

  if (!patch || !filename) {
    console.warn(`Skipping item due to missing patch or filename.`);
    continue;
  }

  const styleGuideForThisItem =
    (USE_ITEM_STYLE_GUIDE_FIRST && typeof itemStyleGuide === "string" && itemStyleGuide.trim().length)
      ? itemStyleGuide
      : decodedContent;

  const docContext = determineDocContext(filename, j);
const {
  guideText: effectiveStyleGuideText,
  sectionsUsed: targetedSectionsRaw
} = composeStyleGuide("", styleGuideSectionData, docContext);

let styleGuideContentForPrompt = "";
let targetedSections = [];

if (effectiveStyleGuideText && effectiveStyleGuideText.trim()) {
  styleGuideContentForPrompt = effectiveStyleGuideText;
  targetedSections = targetedSectionsRaw;
} else if (styleGuideForThisItem && String(styleGuideForThisItem).trim()) {
  styleGuideContentForPrompt = `## Full Style Guide\n${String(styleGuideForThisItem).trim()}`;
  targetedSections = [];
}

if (!styleGuideContentForPrompt || !styleGuideContentForPrompt.trim()) {
  throw new Error("Style guide content not found. Ensure the \"Get row(s)\" data table feeds this node or provide a fallback style guide on the item.");
}

  // compute lengths if not present
  const patchLength = typeof patch === "string" ? patch.length : 0;
  const styleGuideLength =
    typeof styleGuideContentForPrompt === "string" ? styleGuideContentForPrompt.length : 0;
  const charCount = Number.isFinite(inCharCount) ? inCharCount : patchLength;
  const combinedCharCount = Number.isFinite(inCombined) ? inCombined : (patchLength + styleGuideLength);

  totalRuns++;
  logStatus("Processing file", progress, `${filename}`);

  // Valid RIGHT-side (new) line numbers pulled from added_lines
  const validNewLines = Array.isArray(added_lines)
    ? added_lines.map(l => Number(l?.new_line)).filter(n => Number.isFinite(n) && n > 0)
    : [];

  const diffAddedPreview = Array.isArray(added_lines)
    ? added_lines.slice(0, 50).map(l => `+${l.new_line}: ${String(l.content ?? "").slice(0, 140)}`).join("\n")
    : "";

  // Build instruction with strict schema using file_path + line_number
  const correctionMessages = [
    {
      role: "system",
content: `
You are a technical editor enforcing a style guide on GitHub PR diffs.

STYLE-GUIDE RULES (retrieved from the "Get row(s)" data table tool):
"""
${styleGuideContentForPrompt}
"""
${memoryBlock}
FILE: "${filename}"

PATCH (only the supplied changes; do not infer unseen context):
"""
${patch.slice(0, 25000)}
"""

FOLLOW THESE STEPS:
1. Apply only the style-guide rules provided above. If the changed lines already comply, make no suggestion.
2. Work exclusively on RIGHT-side added lines: [${validNewLines.join(", ")}].
3. For each real violation, produce the minimal correction; do not alter unchanged content or surrounding context.
4. Return GitHub-ready JSON:
{
  "Response": {
    "body": "Summary comment or an empty string",
    "comments": [
      {
        "file_path": "${filename}",
        "line_number": VALID_RIGHT_LINE_NUMBER,
        "issue": "Short description of the problem",
        "correction": "The exact suggested replacement line"
      }
    ]
 }
}
- Omit comments entirely if no violations remain. Each \`correction\` must contain the full replacement text (or a \`\`\`suggestion block).
`.trim()
    },
    { role: "user", content: userMessage }
  ];

  const correctionInitialResponse = await model.invoke(correctionMessages);
  const toolUsed = (correctionInitialResponse.tool_calls ?? []).length > 0;
  if (toolUsed) toolUseCount++;

  const correctionOutput = correctionInitialResponse.content || "[No content]";
  logStatus("Correction complete", progress, `${filename} - Output length: ${correctionOutput.length}`);

  // Parse to structured JSON
  let structuredJson = null;
  let structuredSuccess = false;

  try {
    structuredJson = await outputParser.parse(correctionOutput);
    structuredSuccess = true;
    structuredOutputCount++;
  } catch {
    try {
      structuredJson = JSON.parse(correctionOutput);
      structuredSuccess = true;
      structuredOutputCount++;
    } catch {
      structuredJson = {
        Response: {
          body: "Could not parse correction output as structured JSON.",
          comments: []
        }
      };
    }
  }

  let comments = Array.isArray(structuredJson?.Response?.comments)
    ? structuredJson.Response.comments
    : [];

  // Normalize keys to expected schema: file_path + line_number
  comments = comments.map(c => {
    const file_path = c.file_path ?? c.path ?? filename;
    const line_number = (c.line_number ?? c.line);
    return {
      file_path,
      line_number,
      issue: c.issue ?? "",
      correction: c.correction ?? ""
    };
  });

  // Match corrections to added_lines by content similarity; enforce valid RIGHT-side lines
  const addedPool = Array.isArray(added_lines) ? added_lines : [];
  const nonBlankAdded = addedPool.filter(l => !isBlankContent(l?.content));

  function bestMatchForCorrection(correctionText) {
    const pool = isBlankContent(correctionText) ? addedPool : nonBlankAdded;
    let best = null;
    let bestScore = -1;

    for (const lineObj of pool) {
      const score = simpleSimilarity(correctionText, lineObj?.content ?? "");
      if (score > bestScore) {
        bestScore = score;
        best = lineObj;
      }
    }
    return { best, bestScore };
  }

  const aligned = [];
  for (const comment of comments) {
    const { correction } = comment;
    const { best, bestScore } = bestMatchForCorrection(correction);

    if (best && Number.isFinite(best?.new_line) && bestScore >= MIN_SIMILARITY) {
      aligned.push({
        file_path: comment.file_path || filename,
        line_number: Number(best.new_line),
        issue: String(comment.issue || "").slice(0, 300),
        correction: String(correction || "").slice(0, 5000),
        matched_line_preview: String(best.content ?? "").slice(0, 140),
        similarity: Number(bestScore.toFixed(3))
      });
    } else {
      // drop low-confidence/unmatchable comments
    }
  }

  // Per-file result with ALL old fields + new ones
  outputItems.push({
    json: {
      // Core identifiers
      sessionId,

      // ✅ passthrough from input exactly as provided
      filename,                      // file path (e.g. ".github/workflows/…yml")
      file: fileFromInput ?? null,   // status/label from upstream (e.g. "modified", "added")
      fileIndex,
      // Diff + style guide
      charCount,
      combinedCharCount,
      patch,
      style_guide: styleGuideForThisItem,

      // Unified arrays
      added_lines: addedPool,
      removed_lines: Array.isArray(removed_lines) ? removed_lines : [],
      context_lines: Array.isArray(context_lines) ? context_lines : [],

      // Model raw + structured
      original: correctionOutput,
      correctionModel: model.modelName,

      // Pipeline status
      status: "complete",

      structuredOutput: {
        Response: {
          body: structuredJson?.Response?.body ?? "",
          comments: aligned
        }
      },

      // Meta/debug
      meta: {
        usedTool: toolUsed,
        structuredSuccess,
        validRightLines: validNewLines,
        addedPreview: diffAddedPreview,
        styleGuideSectionsUsed: targetedSections,
        languageRegister: docContext.langRegister,
        docTags: Array.from(docContext.docTags || []),
        memoryIncluded: Boolean(memoryContextRaw),
        memoryPreview: memoryContextRaw ? memoryContextRaw.slice(0, 500) : "",
      }
    }
  });

  progress += Math.max(1, Math.floor(70 / Math.max(1, inputItems.length)));
}

// Final stats
const runs = outputItems.length;
const toolUseCountFinal = outputItems.reduce((acc, it) => acc + (it.json?.meta?.usedTool ? 1 : 0), 0);
const structuredOutputCountFinal = outputItems.reduce(
  (acc, it) => acc + ((it.json?.structuredOutput?.Response?.comments ?? []).length > 0 ? 1 : 0), 0
);
const toolUsePercent = runs > 0 ? ((toolUseCountFinal / runs) * 100).toFixed(2) : "0.00";
const structuredOutputPercent = runs > 0 ? ((structuredOutputCountFinal / runs) * 100).toFixed(2) : "0.00";

logStatus(
  "COMPLETE",
  100,
  `Files: ${runs}, Tool Usage: ${toolUseCountFinal}/${runs} (${toolUsePercent}%), Structured Output (non-empty): ${structuredOutputCountFinal}/${runs} (${structuredOutputPercent}%)`
);

// Stats summary item (no file-specific fields here)
outputItems.push({
  json: {
    sessionId,
    meta: {
      model: model.modelName,
      stats: {
        totalRuns: runs,
        toolUse: {
          count: toolUseCountFinal,
          percent: parseFloat(toolUsePercent)
        },
        structuredOutput: {
          count: structuredOutputCountFinal,
          percent: parseFloat(structuredOutputPercent)
        }
      }
    }
  }
});

// Defensive fallback for n8n
return outputItems.map((item, idx) => {
  if (typeof item.json !== 'object' || item.json === null || Array.isArray(item.json)) {
    console.warn(`Invalid json at index ${idx}, replacing with empty object`);
    return { json: {} };
  }
  return item;
});
