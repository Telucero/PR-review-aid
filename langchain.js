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

// --- Logging helper ---
const logStatus = (status, progress, details) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${status} (${progress}%) - ${details}`);
};

logStatus("START", 5, "Loading model");

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

  // compute lengths if not present
  const patchLength = typeof patch === "string" ? patch.length : 0;
  const styleGuideLength = typeof styleGuideForThisItem === "string" ? styleGuideForThisItem.length : 0;
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

STYLE GUIDE (truncated as needed):
"""
${styleGuideForThisItem}
"""

FILE: "${filename}"

PATCH (context only; do not invent line numbers):
"""
${patch.slice(0, 6000)}
"""

RULES:
- Only propose inline suggestions on RIGHT side (added lines).
- Use ONLY these valid GitHub line numbers for comments (RIGHT side): [${validNewLines.join(", ")}]
- Never invent or guess a line number not in that list.
- Each comment must target exactly one of those line numbers.
- Keep "issue" short and factual.
- "correction" must be the full replacement line content to suggest.
- Skip comments if the content already follows the style guide or if the rule is ambiguous.

STYLE REQUIREMENTS TO ENFORCE:
- Chicago Title Case: capitalize first/last words, nouns, pronouns, verbs (including phrasal verbs), adjectives, adverbs, subordinating conjunctions ≥4 letters, and prepositions ≥4 letters. Lowercase short prepositions/articles/conjunctions unless first/last word or part of a verb. Leave \`to\` lowercase in infinitives.
- Lists: keep bullets parallel in structure and length. If one bullet starts with a verb, all must; fragments stay fragments. When every bullet begins with an imperative verb, treat each as a full instruction and end it with a period even if the sentence is short. Fragments that are not verbs omit ending punctuation. Use hyphens for unordered lists and avoid decorative symbols. Description lists must follow \`**Term**: Description\`.
- Punctuation: retain Oxford commas; do not drop punctuation for brevity. Avoid exclamation points in formal docs.
- Formal vs informal tone: default to formal voice. Allow contractions only when front matter shows a tutorial, the file path sits under a tutorials directory, or the content clearly walks readers through steps.
- Inline code: wrap single references in single backticks. Code blocks must use triple backticks with closing fences and include a language tag (for example, \` \`\`\`js \`). Include required imports so snippets are self-contained. Code block titles like \` \`\`\`bash title="Relay chain node"\` are allowed—do not flag them.
- Emojis and symbols: ignore emojis inside fenced code or terminal snippets. Do not require removing emojis that appear in actual output.
- Terminal snippets: ensure styled terminal HTML keeps the \`<div id="termynal" data-termynal>\` structure with prompt/output spans and ends with a blank prompt if control returns to the user. Do not replace with plain code blocks when the component is required.
- Images and alt text: verify the image context before suggesting alternative text. Do not assign alt text from a different section or product.
- Links: external links need \`{{target=\_blank}}\` and descriptive text; when bolding a linked term, wrap the entire link in bold markers (for example, \`**[Term](url){{target=_blank}}**\`).
- Tables: require column headers where applicable, keep cells concise, and avoid decorative emojis or images inside table cells.
- Emphasis: bold UI elements or definition-list terms using double asterisks; italics introduce new terms; never underline text manually.
- Keep suggestions within 60–150 characters when possible, but never remove necessary detail or punctuation to meet length.

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
        addedPreview: diffAddedPreview
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
