"""
Validate and correct PR review comment line numbers using a transformer matcher.

Inputs:
  --files: Path to PR files JSON (from `gh api repos/{repo}/pulls/{pr}/files --paginate --jq '.[]' | jq -s '.'`)
  --response: Path to the n8n response payload JSON (will be updated in place or written to --output)
  --output: Path to write the updated response JSON (defaults to overwrite --response)
  --min-score: Minimum combined similarity score to accept a match (0-1, default 0.55)
  --blocked-patterns: Comma-separated substrings to skip (default blocks ".ai/" and "llms")
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
from sentence_transformers import SentenceTransformer


def is_blocked_path(path: str, blocked: List[str]) -> bool:
    lower = (path or "").lower()
    return any(p in lower for p in blocked)


def parse_patch(patch: str) -> List[Dict]:
    """Parse unified diff text and return added lines with new_line numbers."""
    added_lines = []
    old_line = 0
    new_line = 0
    eof_meta = "\\ No newline at end of file"

    for raw in (patch or "").splitlines():
        if raw == eof_meta or raw.startswith("+++ ") or raw.startswith("--- "):
            continue
        if raw.startswith("@@"):
            m = re.search(r"@@ -(\d+),?\d* \+(\d+),?\d* @@", raw)
            if m:
                old_line = int(m.group(1)) - 1
                new_line = int(m.group(2)) - 1
            continue
        if raw.startswith("+") and not raw.startswith("+++"):
            added_lines.append(
                {
                    "line_number": new_line + 1,
                    "content": raw[1:] if raw[1:] != "" else "\n",
                }
            )
            new_line += 1
        elif raw.startswith("-") and not raw.startswith("---"):
            old_line += 1
        else:
            # context line
            old_line += 1
            new_line += 1

    return added_lines


def load_files(files_path: Path, blocked_patterns: List[str]) -> Dict[str, List[Dict]]:
    raw = json.loads(files_path.read_text())
    if not isinstance(raw, list):
        return {}
    result: Dict[str, List[Dict]] = {}
    for item in raw:
        filename = item.get("filename")
        patch = item.get("patch")
        status = (item.get("status") or "").lower()
        if (
            not filename
            or not isinstance(patch, str)
            or patch.strip() == ""
            or is_blocked_path(filename, blocked_patterns)
            or status == "removed"
        ):
            continue
        result[filename] = parse_patch(patch)
    return result


def choose_text(body: str, comment: Dict) -> str:
    """Extract text to match from the comment body or other fields."""
    text = body or ""
    # Prefer content inside ```suggestion ... ```
    m = re.search(r"```suggestion\\s*(.*?)```", text, flags=re.DOTALL | re.IGNORECASE)
    if m:
        candidate = m.group(1).strip()
        if candidate:
            return candidate
    # Otherwise use first non-empty line
    for line in text.splitlines():
        stripped = line.strip()
        if stripped:
            return stripped
    # Fallback to other fields
    for key in ("issue", "comment", "review", "text", "content"):
        val = comment.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()
    return ""


def cosine_sim_matrix(vec: np.ndarray, mat: np.ndarray) -> np.ndarray:
    if mat.shape[0] == 0:
        return np.zeros((0,), dtype=float)
    return (mat @ vec).astype(float)


def load_payload(path: Path) -> Tuple[Dict, List[Dict]]:
    raw = json.loads(path.read_text() or "null")
    if isinstance(raw, list):
        raw = raw[0] if raw else {}

    payload_entries = raw.get("payload") or []
    if isinstance(payload_entries, str):
        try:
            payload_entries = json.loads(payload_entries)
        except json.JSONDecodeError:
            payload_entries = []
    if isinstance(payload_entries, dict):
        primary_payload = payload_entries
    elif isinstance(payload_entries, list) and payload_entries:
        primary_payload = payload_entries[0]
    else:
        primary_payload = {}

    prepared = (
        raw.get("prepared_comment_payloads")
        or primary_payload.get("prepared_comment_payloads")
        or []
    )
    if isinstance(prepared, dict):
        prepared = [prepared]

    return raw, prepared


def update_payload(raw: Dict, prepared: List[Dict]) -> Dict:
    raw["prepared_comment_payloads"] = prepared
    payload_entries = raw.get("payload")
    if isinstance(payload_entries, dict):
        payload_entries["prepared_comment_payloads"] = prepared
        raw["payload"] = payload_entries
    elif isinstance(payload_entries, list) and payload_entries:
        payload_entries[0]["prepared_comment_payloads"] = prepared
        raw["payload"] = payload_entries
    return raw


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate/correct review comment line numbers using transformer similarity."
    )
    parser.add_argument("--files", required=True, help="Path to PR files JSON.")
    parser.add_argument(
        "--response", required=True, help="Path to response_body.json from n8n."
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Where to write the updated response (default: overwrite --response).",
    )
    parser.add_argument(
        "--min-score",
        type=float,
        default=0.55,
        help="Minimum combined similarity score to accept a match (0-1).",
    )
    parser.add_argument(
        "--blocked-patterns",
        default="/.ai/,llms",
        help="Comma-separated patterns to block (case-insensitive substrings).",
    )
    parser.add_argument(
        "--upstream-added-lines",
        default=None,
        help="Optional path to added_lines.json from gather step for comparison/logging.",
    )
    args = parser.parse_args()

    files_path = Path(args.files)
    response_path = Path(args.response)
    output_path = Path(args.output) if args.output else response_path
    min_score = max(0.0, min(1.0, args.min_score))
    blocked_patterns = [p.strip().lower() for p in args.blocked_patterns.split(",") if p.strip()]

    added_by_file = load_files(files_path, blocked_patterns)
    upstream_added = {}
    if args.upstream_added_lines:
        try:
            upstream_added = json.loads(Path(args.upstream_added_lines).read_text())
            if not isinstance(upstream_added, list):
                upstream_added = []
        except Exception:
            upstream_added = []

    raw_payload, comments = load_payload(response_path)

    model = SentenceTransformer("all-MiniLM-L6-v2")
    skipped = []
    corrected = []

    embeddings_cache: Dict[str, np.ndarray] = {}

    debug_entries = []

    # Optional: log mismatch between upstream added_lines and recomputed
    if upstream_added:
        upstream_map = {item.get("file_path"): item.get("added_lines", []) for item in upstream_added if isinstance(item, dict)}
        mismatches = []
        for fp, lines in added_by_file.items():
            upstream_lines = upstream_map.get(fp) or []
            upstream_nums = {l.get("line_number") for l in upstream_lines if isinstance(l, dict)}
            recomputed_nums = {l.get("line_number") for l in lines}
            if upstream_nums != recomputed_nums:
                mismatches.append(
                    {
                        "file_path": fp,
                        "upstream_only": sorted(list(upstream_nums - recomputed_nums)),
                        "recomputed_only": sorted(list(recomputed_nums - upstream_nums)),
                    }
                )
        if mismatches:
            print("Note: Upstream added_lines differ from recomputed:", json.dumps(mismatches, indent=2))

    for comment in comments:
        file_path = comment.get("path") or comment.get("file_path")
        body = comment.get("body") or ""
        match_text = choose_text(body, comment)

        original_line = comment.get("line")

        if not file_path or file_path not in added_by_file:
            skipped.append(
                {
                    "file_path": file_path or "",
                    "reason": "no_added_lines_for_file",
                    "body_preview": body[:200],
                }
            )
            debug_entries.append(
                {
                    "path": file_path or "",
                    "decision": "skipped:no_added_lines",
                    "original_line": original_line,
                    "best_match_line": None,
                    "best_score": None,
                    "top_candidates": [],
                }
            )
            corrected.append(comment)
            continue

        added_lines = added_by_file[file_path]
        if not added_lines or not match_text.strip():
            skipped.append(
                {
                    "file_path": file_path,
                    "reason": "empty_text_or_no_lines",
                    "body_preview": body[:200],
                }
            )
            debug_entries.append(
                {
                    "path": file_path,
                    "decision": "skipped:empty_text_or_no_lines",
                    "original_line": original_line,
                    "best_match_line": None,
                    "best_score": None,
                    "top_candidates": [],
                }
            )
            corrected.append(comment)
            continue

        if file_path not in embeddings_cache:
            texts = [l["content"] for l in added_lines]
            embeddings_cache[file_path] = model.encode(
                texts, convert_to_numpy=True, normalize_embeddings=True
            )
        E = embeddings_cache[file_path]
        v = model.encode(match_text, convert_to_numpy=True, normalize_embeddings=True)

        sims_emb = cosine_sim_matrix(v, E)
        combined = sims_emb
        order = np.argsort(combined)[::-1]
        top_candidates = []
        for idx in order[: min(5, len(order))]:
            top_candidates.append(
                {
                    "line": added_lines[int(idx)]["line_number"],
                    "combined": float(combined[int(idx)]),
                    "embedding": float(sims_emb[int(idx)]),
                }
            )

        best_idx = int(order[0])
        best_score = float(combined[best_idx])
        best_line_num = added_lines[best_idx]["line_number"]

        if best_score < min_score:
            skipped.append(
                {
                    "file_path": file_path,
                    "reason": "low_confidence",
                    "score": best_score,
                    "body_preview": body[:200],
                    "best_match_line": best_line_num,
                }
            )
            debug_entries.append(
                {
                    "path": file_path,
                    "decision": "skipped:low_confidence",
                    "original_line": original_line,
                    "best_match_line": best_line_num,
                    "best_score": best_score,
                    "top_candidates": top_candidates,
                }
            )
            corrected.append(comment)
            continue

        best_line = added_lines[best_idx]
        updated = dict(comment)
        updated["path"] = file_path
        updated.pop("position", None)  # prefer explicit line/side over position
        updated["line"] = best_line_num
        updated["side"] = updated.get("side") or "RIGHT"
        if "start_line" in updated or "start_side" in updated:
            updated["start_line"] = updated.get("start_line", updated["line"])
            updated["start_side"] = updated.get("start_side", updated["side"])
            if updated["start_line"] > updated["line"]:
                updated["start_line"] = updated["line"]
        corrected.append(updated)
        debug_entries.append(
            {
                "path": file_path,
                "decision": "corrected" if original_line != best_line_num else "unchanged:best_match_same_line",
                "original_line": original_line,
                "best_match_line": best_line_num,
                "best_score": best_score,
                "top_candidates": top_candidates,
            }
        )

    raw_payload["prepared_comment_payloads"] = corrected
    raw_payload["skipped_comments"] = (
        skipped + raw_payload.get("skipped_comments", [])
        if isinstance(raw_payload.get("skipped_comments"), list)
        else skipped
    )
    raw_payload = update_payload(raw_payload, corrected)

    output_path.write_text(json.dumps(raw_payload, indent=2), encoding="utf-8")
    Path("match_debug.json").write_text(json.dumps(debug_entries, indent=2), encoding="utf-8")
    print(f"Processed {len(comments)} comments; corrected {len(comments) - len(skipped)}, skipped {len(skipped)}.")


if __name__ == "__main__":
    main()
