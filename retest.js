const inputItems = this.getInputData();

/* -------------------- session / globals -------------------- */
const sessionId = inputItems?.[0]?.json?.sessionId || "default-session";
const userMessage =
  inputItems?.[0]?.json?.chatInput ||
  inputItems?.[0]?.json?.message ||
  inputItems?.[0]?.json?.content ||
  "No input provided";

// First item style_guide as default; per-item may override
const defaultStyleGuide = inputItems?.[0]?.json?.style_guide || "";

/* -------------------- logging -------------------- */
const logStatus = (status, progress, details) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${status} (${progress}%) - ${details}`);
};

logStatus("START", 5, "Loading model");

/* -------------------- model / parser -------------------- */
const models = await this.getInputConnectionData('ai_languageModel', 0);
if (!models || models.length === 0) throw new Error("Language model not connected or not enabled");
const model = models[0];
logStatus("Model loaded", 10, `Model: ${model.modelName}`);

const outputParsers = await this.getInputConnectionData('ai_outputParser', 0);
if (!outputParsers || outputParsers.length === 0) throw new Error("No output parser connected");
const outputParser = outputParsers[0];

/* -------------------- helpers -------------------- */
function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/```suggestion[\s\S]*?```/g, m => m.replace(/```suggestion|```/g, ""))  // strip suggestion fences
    .replace(/```[\s\S]*?```/g, m => m.replace(/```/g, ""))                           // strip generic fences
    .replace(/`+/g, "")                                                               // strip inline backticks
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// simple similarity: exact → 1.0, contains → 0.95, else 0
function simpleSimilarity(a, b) {
  if (!a || !b) return 0;
  a = normalize(a); b = normalize(b);
  if (!a && !b) return 1;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.95;
  return 0;
}

const isBlankContent = s => s === "\n" || /^\s*$/.test(String(s || ""));

// Normalize added_lines from either old or new format
// Input can be [{line_number, content}] or [{new_line, content}].
// We return a canonical array with { line_number, content, old_line?, new_line? }.
function normalizeAddedLines(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(l => {
      const ln = Number(l?.line_number ?? l?.new_line);
      const content = l?.content ?? "";
      const old_line = Number.isFinite(l?.old_line) ? l.old_line : null;
      const new_line = Number.isFinite(l?.new_line) ? l.new_line : (Number.isFinite(l?.line_number) ? l.line_number : null);
      return Number.isFinite(ln) && ln > 0
        ? { line_number: ln, content, old_line, new_line }
        : null;
    })
    .filter(Boolean);
}

function normalizeContextLines(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(l => {
      const newLine = Number(l?.new_line);
      const oldLine = Number.isFinite(l?.old_line) ? l.old_line : null;
      const content = l?.content ?? "";
      return Number.isFinite(newLine) && newLine > 0
        ? { line_number: newLine, new_line: newLine, old_line: oldLine, content }
        : null;
    })
    .filter(Boolean);
}

/* -------------------- main -------------------- */
const outputItems = [];
let progress = 20;
let totalRuns = 0;
let structuredOutputCount = 0;

for (const item of inputItems) {
  const j = item?.json ?? {};
  const {
    filename,
    patch: rawPatch,
    mergedPatch,               // still supported
    fileIndex,

    // new inputs
    style_guide: itemStyleGuide,
    raw_url,                               // passthrough only; aggregator may drop
    file_status: fileGitStatus,            // ✅ read correct field name
    status: pipelineStatus,                // pipeline status (we set our own "complete" below)
    added_lines: inputAdded = [],
    removed_lines: inputRemoved = [],
    context_lines: inputContext = [],

    // legacy counts (if already present)
    charCount: inCharCount,
    combinedCharCount: inCombinedCharCount,
  } = j;

  // choose patch source
  const patch = (typeof rawPatch === 'string' && rawPatch.length > 0)
    ? rawPatch
    : (typeof mergedPatch === 'string' ? mergedPatch : '');

  if (!patch || !filename) {
    console.warn(`Skipping item due to missing patch/mergedPatch or filename.`);
    continue;
  }

  // per-item style guide fallback
  const styleGuideForThisItem =
    (typeof itemStyleGuide === "string" && itemStyleGuide.trim()) ? itemStyleGuide : defaultStyleGuide;

  // normalize arrays
  const added_lines_norm = normalizeAddedLines(inputAdded);
  const removed_lines_norm = Array.isArray(inputRemoved) ? inputRemoved : [];
  const context_lines_norm = normalizeContextLines(inputContext);

  const addedPool = added_lines_norm;
  const validRightLineNumbers = addedPool.map(l => l.line_number);
  const validLineSet = new Set(validRightLineNumbers);
  const contentByLine = new Map(addedPool.map(line => [line.line_number, line.content]));

  const nonBlankAdded = addedPool.filter(l => !isBlankContent(l?.content));

  const MIN_SIMILARITY = 0.85;

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
      const newLine = Number(lineObj?.new_line ?? lineObj?.line_number);
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

  totalRuns++;
  logStatus("Processing file", progress, `${filename}`);

  const allowedLinesList = validRightLineNumbers.join(", ");

  const correctionMessages = [
    {
      role: "system",
      content: `
You are a professional technical editor using the style guide below to review a GitHub diff.

STYLE GUIDE (may be truncated):
"""
${styleGuideForThisItem}
"""

FILE: "${filename}"

PATCH (context only; do not invent line numbers):
"""
${patch.slice(0, 6000)}
"""

RULES:
- Only comment on RIGHT-side (added) lines.
- Use ONLY these valid GitHub RIGHT line numbers: [${allowedLinesList}]
- Never guess line numbers outside this set.
- Each comment targets one line number from that set.
- Keep "issue" short and factual.
- "correction" is the full replacement line (single line), no code fences.

RESPONSE FORMAT (strict JSON):
{
  "Response": {
    "body": "Summary comment or empty string.",
    "comments": [
      {
        "path": "${filename}",
        "line": VALID_RIGHT_LINE_NUMBER,
        "issue": "Short description of the problem",
        "correction": "Suggested fix (exact one-line replacement)"
      }
    ]
  }
}
`.trim()
    },
    { role: "user", content: userMessage }
  ];

  const correctionInitialResponse = await model.invoke(correctionMessages);
  const usedTool = Array.isArray(correctionInitialResponse?.tool_calls) && correctionInitialResponse.tool_calls.length > 0;
  const correctionOutput = correctionInitialResponse?.content || "[No content]";
  logStatus("Correction complete", progress, `${filename} - Output length: ${correctionOutput.length}`);

  // parse to structured
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
        Response: { body: "Could not parse correction output as structured JSON.", comments: [] }
      };
    }
  }

  // comments (keep legacy path/line; add new file_path/line_number + enrichments)
  const rawComments = Array.isArray(structuredJson?.Response?.comments)
    ? structuredJson.Response.comments
    : [];
  const normalizedComments = [];

  for (const original of rawComments) {
    const comment = typeof original === "object" && original !== null ? { ...original } : {};
    const proposedPath = comment.path ?? filename;
    const proposedLine = Number(comment.line ?? comment.line_number);

    let target = null;
    let matchedBy = "line_number";
    let similarityScore = 1.0;

    if (validLineSet.has(proposedLine) && !isBlankContent(contentByLine.get(proposedLine))) {
      target = addedPool.find(l => Number(l?.new_line ?? l?.line_number) === proposedLine) ?? null;
    }

    if (!target) {
      const { best, bestScore } = bestMatchForCorrection(comment.correction || comment.issue || "");
      if (best && Number.isFinite(best?.line_number) && bestScore >= MIN_SIMILARITY) {
        target = best;
        matchedBy = "similarity";
        similarityScore = bestScore;
      }
    }

    if (!target && Number.isFinite(proposedLine)) {
      const nearest = closestAddedLine(proposedLine);
      if (nearest) {
        target = nearest;
        matchedBy = "nearest_line";
        const dist = Math.abs(Number(nearest.line_number ?? nearest.new_line) - proposedLine);
        similarityScore = dist === 0 ? 1 : 1 / (1 + dist);
      }
    }

    if (!target) {
      continue;
    }

    const newLineNumber = Number(target.new_line ?? target.line_number);
    comment.path = proposedPath;
    comment.line = newLineNumber;
    comment.file_path = proposedPath;
    comment.line_number = newLineNumber;
    comment.matched_line = target.content ?? "";
    comment.line_content = target.content ?? "";
    comment.matched_by = matchedBy;
    comment.similarity = Number(similarityScore).toFixed(3);

    normalizedComments.push(comment);
  }

  const comments = normalizedComments;

  // counts (keep same keys)
  const charCount = Number.isFinite(inCharCount) ? inCharCount : patch.length;
  const combinedCharCount = Number.isFinite(inCombinedCharCount)
    ? inCombinedCharCount
    : (patch.length + styleGuideForThisItem.length);

  // Output (old fields preserved; new fields added)
  outputItems.push({
    json: {
      sessionId,
      file: filename,                 // legacy
      patch,                          // legacy
      fileIndex,                      // legacy
      added_lines: added_lines_norm,  // legacy name preserved
      original: correctionOutput,     // legacy
      correctionModel: model.modelName,
      status: "complete",             // pipeline status for this node
      charCount,
      combinedCharCount,

      // NEW passthroughs / arrays (added columns)
      raw_url: raw_url ?? null,
      file_status: fileGitStatus ?? null,  // ✅ correct input field
      removed_lines: removed_lines_norm,
      context_lines: context_lines_norm,
      style_guide: styleGuideForThisItem,  // passthrough (aggregator may drop)

      structuredOutput: {
        Response: {
          body: structuredJson?.Response?.body ?? "",
          comments
        }
      },

      meta: {
        usedTool,
        structuredSuccess
      }
    }
  });

  progress += Math.max(1, Math.floor(70 / Math.max(1, inputItems.length)));
}

// summary item (unchanged style)
const structuredOutputPercent = totalRuns > 0
  ? ((structuredOutputCount / totalRuns) * 100).toFixed(2)
  : "0.00";

logStatus(
  "COMPLETE",
  100,
  `Files: ${outputItems.length}, Structured Output: ${structuredOutputCount}/${totalRuns} (${structuredOutputPercent}%)`
);

outputItems.push({
  json: {
    sessionId,
    meta: {
      model: model.modelName,
      stats: {
        totalRuns,
        structuredOutput: {
          count: structuredOutputCount,
          percent: parseFloat(structuredOutputPercent)
        }
      }
    }
  }
});

// Defensive fallback
return outputItems.map((item, idx) => {
  if (typeof item.json !== 'object' || item.json === null || Array.isArray(item.json)) {
    console.warn(`Invalid json at index ${idx}, replacing with empty object`);
    return { json: {} };
  }
  return item;
});
