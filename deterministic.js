const inputItems = this.getInputData();

// --- Config ---
const MIN_SIMILARITY = 0.85; // drop comments if match < this
const USE_ITEM_STYLE_GUIDE_FIRST = true;
const MAX_TERMS_IN_PROMPT = 1000; // safety cap

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

// --- Master terms ingestion (from any item.json.Reference as stringified JSON) ---
function parseMasterTerms(items) {
  const all = [];
  for (const it of items) {
    const ref = it?.json?.Reference;
    if (!ref) continue;
    try {
      const obj = typeof ref === 'string' ? JSON.parse(ref) : ref;
      if (Array.isArray(obj?.terms)) all.push(...obj.terms);
    } catch (_) {/* ignore */}
  }
  // Deduplicate & clean
  return [...new Set(all.map(String).map(s => s.trim()).filter(Boolean))];
}

const MASTER_TERMS = parseMasterTerms(inputItems);
const MASTER_TERMS_LOWER = new Set(MASTER_TERMS.map(t => t.toLowerCase()));

// --- Logging helper ---
const logStatus = (status, progress, details) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${status} (${progress}%) - ${details}`);
};

logStatus("START", 5, `Loading model; terms: ${MASTER_TERMS.length}`);

// --- Model connections ---
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

// Ensure suggestions don’t alter valid domain terms already present in the original line
function protectTerms(originalLine, suggestion, termsList) {
  let protectedSuggestion = String(suggestion ?? "");
  const orig = String(originalLine ?? "");
  for (const term of termsList) {
    if (!term) continue;
    const reI = new RegExp(term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
    if (reI.test(orig)) {
      const match = orig.match(reI);
      if (match && match[0]) {
        const exact = match[0];
        const reAll = new RegExp(term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
        protectedSuggestion = protectedSuggestion.replace(reAll, exact);
      }
    }
  }
  return protectedSuggestion;
}

/** Strip ALL fenced code blocks (anything that starts with ``` and ends with ```).
 * Handles malformed fences by removing from the last opening fence to the end.
 */
function stripFencedCodeBlocks(text) {
  if (!text) return text;
  let out = String(text);

  // Remove all well-formed fences
  out = out.replace(/```[\s\S]*?```/g, "");

  // If there's an unmatched opening ``` left, drop to end
  const lastOpen = out.lastIndexOf("```");
  if (lastOpen !== -1) {
    out = out.slice(0, lastOpen);
  }
  return out;
}

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
    status: fileGitStatus,
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

  // compute lengths if not present
  const patchLength = typeof patch === "string" ? patch.length : 0;
  const styleGuideLength = typeof styleGuideForThisItem === "string" ? styleGuideForThisItem.length : 0;
  const charCount = Number.isFinite(inCharCount) ? inCharCount : patchLength;
  const combinedCharCount = Number.isFinite(inCombined) ? inCombined : (patchLength + styleGuideLength);

  totalRuns++;
  logStatus("Processing file", progress, `${filename}`);

  const addedPool = Array.isArray(added_lines) ? added_lines : [];
  const validNewLines = [...new Set(addedPool
    .map(l => Number(l?.new_line))
    .filter(n => Number.isFinite(n) && n > 0))];

  const nonBlankAdded = addedPool.filter(l => !isBlankContent(l?.content));

  function bestMatchForCorrection(correctionText) {
    const text = String(correctionText || "");
    const pool = isBlankContent(text) ? addedPool : nonBlankAdded;
    let best = null;
    let bestScore = -1;

    for (const lineObj of pool) {
      const score = simpleSimilarity(text, lineObj?.content ?? "");
      if (score > bestScore) {
        bestScore = score;
        best = lineObj;
      }
    }

    return { best, bestScore };
  }

  function closestAddedLine(targetLine) {
    if (!Number.isFinite(targetLine) || addedPool.length === 0) return null;
    let best = null;
    let bestDist = Infinity;

    for (const lineObj of addedPool) {
      const newLine = Number(lineObj?.new_line);
      if (!Number.isFinite(newLine)) continue;
      const dist = Math.abs(newLine - targetLine);
      if (dist < bestDist) {
        bestDist = dist;
        best = lineObj;
      } else if (dist === bestDist) {
        if (best && isBlankContent(best.content) && !isBlankContent(lineObj.content)) {
          best = lineObj;
        }
      }
    }

    return best;
  }

  const diffAddedPreview = Array.isArray(added_lines)
    ? added_lines.slice(0, 50).map(l => `+${l.new_line}: ${String(l.content ?? "").slice(0, 140)}`).join("\n")
    : "";

  // Build domain-terms payload for the prompt (capped for safety)
  const termsForPrompt = MASTER_TERMS.slice(0, MAX_TERMS_IN_PROMPT);

  // ---- NEW: sanitize PATCH to omit fenced code blocks BEFORE sending to the model
  const patchForPrompt = stripFencedCodeBlocks(patch);

  // Build instruction with strict schema using file_path + line_number
  const correctionMessages = [
    {
      role: "system",
      content: `
You are a technical editor enforcing a style guide on GitHub PR diffs.

STYLE GUIDE (truncated as needed):
"""
${styleGuideForThisItem}
"""

IMPORTANT DOMAIN TERMS (treat these spellings/punctuation as canonical; do NOT "correct" or re-case them; do not wrap them in backticks):
${JSON.stringify(termsForPrompt, null, 2)}

ALSO ENFORCE:
- When adding external links, use exactly "{target=\\_blank}" (with a single backslash before underscore) when required by the style guide.

FILE: "${filename}"

PATCH (context only; do not invent line numbers):
"""
${String(patchForPrompt).slice(0, 6000)}
"""

RULES:
- Only propose inline suggestions on RIGHT side (added lines).
- Use ONLY these valid GitHub line numbers for comments (RIGHT side): [${validNewLines.join(", ")}]
- Never invent or guess a line number not in that list.
- Each comment must target exactly one of those line numbers.
- Keep "issue" short and factual.
- "correction" must be the full replacement line content to suggest.
- Do NOT alter any token that matches the domain terms above (including case and punctuation).
- Skip comments if the content already follows the style guide or if the rule is ambiguous.

RESPONSE FORMAT (strict JSON):
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

  const aligned = [];
  for (const comment of comments) {
    const { correction } = comment;
    const proposedLine = Number(comment.line_number);
    let target = null;
    let matchedBy = "line_number";
    let similarity = 1.0;

    if (validNewLines.includes(proposedLine)) {
      const direct = addedPool.find(l => Number(l?.new_line) === proposedLine) || null;
      if (direct && !isBlankContent(direct.content)) {
        target = direct;
      }
    }

    if (!target) {
      const { best, bestScore } = bestMatchForCorrection(correction);
      if (best && Number.isFinite(best?.new_line) && bestScore >= MIN_SIMILARITY) {
        target = best;
        matchedBy = "similarity";
        similarity = Number(bestScore.toFixed(3));
      }
    }

    if (!target && Number.isFinite(proposedLine)) {
      const nearest = closestAddedLine(proposedLine);
      if (nearest) {
        target = nearest;
        matchedBy = "nearest_line";
        const dist = Math.abs(Number(nearest.new_line) - proposedLine);
        similarity = Number((dist === 0 ? 1 : 1 / (1 + dist)).toFixed(3));
      }
    }

    if (!target) {
      continue;
    }

    const protectedCorrection = protectTerms(target.content, correction, MASTER_TERMS);

    aligned.push({
      file_path: comment.file_path || filename,
      line_number: Number(target.new_line),
      issue: String(comment.issue || "").slice(0, 300),
      correction: String(protectedCorrection || "").slice(0, 5000),
      matched_line_preview: String(target.content ?? "").slice(0, 140),
      similarity,
      matched_by: matchedBy
    });
  }

  // Per-file result with ALL old fields + new ones
  outputItems.push({
    json: {
      // Core identifiers
      sessionId,

      // ✅ passthrough from input exactly as provided
      filename,
      file: fileFromInput ?? null,
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
        domainTermsUsed: MASTER_TERMS.length,
        patchSanitizedForModel: true // 👈 indicates we removed fenced blocks in the prompt
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

// Stats summary item
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
        },
        domainTerms: {
          count: MASTER_TERMS.length,
          source: "Reference (stringified JSON)",
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
