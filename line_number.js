// Step 1: Get style guide text (prefer plain text in `style_guide`, else decode base64 `content`)
let decodedContent = "";
try {
  const first = $input.first()?.json ?? {};
  if (typeof first.style_guide === "string" && first.style_guide.trim() !== "") {
    decodedContent = first.style_guide;
  } else if (typeof first.content === "string" && first.content.trim() !== "") {
    decodedContent = Buffer.from(first.content, "base64").toString("utf-8");
  } else {
    decodedContent = "";
  }
} catch (e) {
  decodedContent = `Failed to obtain style guide: ${e.message}`;
}

// Step 2: Collect files (prefer Receiving_webhook, else try current input items' `files`)
let files = [];
try {
  const fromWebhook = $('Receiving_webhook').first()?.json?.body?.files;
  if (Array.isArray(fromWebhook) && fromWebhook.length > 0) {
    files = fromWebhook;
  } else {
    const fromInputArrays = $input.all()
      .map(i => i.json?.files)
      .filter(arr => Array.isArray(arr) && arr.length > 0);
    if (fromInputArrays.length > 0) files = fromInputArrays.flat();
  }
} catch {
  files = [];
}

function isBlockedPath(p) {
  const s = String(p || "").toLowerCase();
  return s.includes("/.ai/") || s.startsWith(".ai/") || s.includes("llm"); // blocks .ai/* and any *llm*
}

// Step 3: Parse unified diff; ensure added lines have only new_line, removed only old_line.
// Context lines (unchanged) have both. Handle EOF meta and phantom blank at EOF.
function parseUnifiedDiff(patch) {
  const eofMetaMarker = "\\ No newline at end of file";
  const endsWithNewline = patch.endsWith("\n");
  const rawLines = String(patch || "").split("\n");

  let oldLine = 0; // we'll set from hunk header
  let newLine = 0;

  const added = [];
  const removed = [];
  const context = [];

  const total = rawLines.length;
  for (let i = 0; i < total; i++) {
    const raw = rawLines[i];
    if (i === total - 1 && raw === "" && endsWithNewline) {
      continue; // ignore splitter artifact from trailing newline
    }
    const line = raw.replace(/\r$/, ""); // normalize CRLF

    if (line === eofMetaMarker) continue;               // skip meta
    if (line.startsWith("+++") || line.startsWith("---")) continue; // skip file headers

    if (line.startsWith("@@")) {
      const m = /@@ -(\d+),?\d* \+(\d+),?\d* @@/.exec(line);
      if (m) {
        // set counters to start-1; we will ++ before using to make them 1-based
        oldLine = parseInt(m[1], 10) - 1;
        newLine = parseInt(m[2], 10) - 1;
      }
      continue;
    }

    if (line.startsWith("+")) {
      if (line.startsWith("+++")) continue; // already handled above; guard anyway
      let content = line.slice(1);

      // Avoid phantom blank line at EOF if the patch doesn't actually end with a newline
      const isLast = (i === rawLines.length - 1);
      const isBlank = (content === "");
      if (isLast && isBlank && !endsWithNewline) {
        // skip phantom
      } else {
        const nl = newLine + 1;
        added.push({
          old_line: null,
          new_line: nl,
          content: isBlank ? "\n" : content
        });
      }
      newLine++;
    } else if (line.startsWith("-")) {
      if (line.startsWith("---")) continue; // already handled above; guard anyway
      const ol = oldLine + 1;
      removed.push({
        old_line: ol,
        new_line: null,
        content: line.slice(1)
      });
      oldLine++;
    } else {
      // context line
      const ol = oldLine + 1;
      const nl = newLine + 1;
      context.push({
        old_line: ol,
        new_line: nl,
        content: line
      });
      oldLine++;
      newLine++;
    }
  }

  return { added_lines: added, removed_lines: removed, context_lines: context };
}

// Step 4: Build one item per patched file with arrays for added/removed/context
const patchedFiles = (files || [])
  .filter(file => {
    const name = String(file?.filename || "");
    const hasPatch = typeof file?.patch === "string" && file.patch.length > 0;
    return hasPatch && !isBlockedPath(name);  // ← exclude .ai/* and *llm*
  })
  .map((file, index) => {
    const patchText = file.patch;
    const { added_lines, removed_lines, context_lines } = parseUnifiedDiff(patchText);
    const patchLength = patchText.length;
    const styleGuideLength = decodedContent.length;
    return {
      json: {
        fileIndex: index,
        filename: file.filename,
        file: file.status,
        patch: patchText,
        style_guide: decodedContent,
        charCount: patchLength,
        combinedCharCount: patchLength + styleGuideLength,
        added_lines, removed_lines, context_lines
      }
    };
  });
// Step 5: Return parsed result or fallback (still include style guide)
if (patchedFiles.length > 0) {
  return patchedFiles;
} else {
  return [
    {
      json: {
        warning: "No files with a `patch` were found in the payload.",
        style_guide: decodedContent,
        decodedContentPreview: decodedContent.slice(0, 200)
      }
    }
  ];
}
