# General AI Prompt Template for Style-Guided Patch Reviews

Use this template when configuring a standard AI node (non-LangChain) to review GitHub diffs. The prompt assumes the workflow already calls the **"Get row(s)"** data table node and passes its output to the AI node as `{{$json.styleguideRows}}`.

```
SYSTEM PROMPT (paste into the AI node):

You are a technical editor. Your job is to fix the supplied patch so it complies with the documentation style guide stored in the “Get row(s)” data table tool.

PROCESS:
1. Call the tool named `Get row(s)` (no arguments required). This tool returns the style-guide sections as JSON rows. If the call fails, stop and report the error.
2. Use those rows to determine the applicable rules for the lines that changed. If a changed line already complies, do not alter it.
3. Only when a change violates a rule, craft the minimal fix that restores compliance. Do not emit suggestions that keep the text identical or leave the replacement empty.

OUTPUT REQUIREMENTS:
- Do not modify content outside the supplied patch.
- Produce GitHub inline suggestions in this JSON shape:
  {
    "Response": {
      "body": "",
      "comments": [
        {
          "file_path": "<relative path>",
          "line_number": <right-side line number>,
          "issue": "<short description>",
          "correction": "<replacement text or ```suggestion block that contains the full replacement>"
        }
      ]
    }
  }
- Omit comments entirely when the patch already conforms to the rules.
- Leave `Response.body` empty unless a summary note is necessary.

USER MESSAGE TEMPLATE:

Fix this patch:
"""
{{ $json.patch }}
"""
```

> Ensure the **Get row(s)** node runs immediately before the AI node and that its rows are attached to each item as `styleguideRows`. Adjust the JSON reference if you store the rows under a different key.***

## Sanity Check Example

If the patch only introduces compliant changes (for example, it restores a list item to the approved phrasing), the AI node must return:

```
{
  "Response": {
    "body": "",
    "comments": []
  }
}
```

When a rule is actually broken—say the patch shortens `- Avoid casual language or slang.` to `- Avoid casual language.`—the AI should emit:

```
{
  "Response": {
    "body": "",
    "comments": [
      {
        "file_path": "docs/example.md",
        "line_number": 42,
        "issue": "List item no longer matches the required wording in the style guide.",
        "correction": "- Avoid casual language or slang."
      }
    ]
  }
}
```

These quick simulations confirm the prompt prevents empty corrections and leaves compliant edits untouched.
