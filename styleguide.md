## How to Use This Guide

Follow these steps before proposing edits or automated review comments.

### Quick Checklist

1. Identify the document type (tutorial, guide, concept, or reference) by checking the front matter or directory structure.
2. Compose suggestions as complete sentences that include terminating punctuation; aim for concise copy without sacrificing clarity.
3. Provide concrete examples only when they add clarity or are required by the rule; otherwise keep feedback focused on the change.
4. Avoid feedback on code snippets, inline code, or terminal examples.
5. Super informal language or slang in documentation is not allowed but normal phrases you would use in standard speech and writing are acceptable.

### Clarity and Specificity
- **Rule L1 – Use a neutral, instructional voice.** Avoid overt marketing claims, superlatives, or promises such as "learn everything you need to know." Descriptive adjectives that state facts about the product are allowed when they can be backed by documentation (for example, "An open-source library that provides powerful XCM tooling" is acceptable if the tooling is demonstrably comprehensive).Adjectives that describes degrees of quality, goodness, completeness, strength, or significance are allowed. Prefer declarative sentences that state exactly what the page delivers. 
  Use: `This guide explains how light clients validate blocks on Polkadot.`  
  Avoid: `Learn everything you need to know about light clients on Polkadot.`
- **Rule L2 – Provide context before instructions.** State prerequisites, the goal, or the system state before telling the reader what to click or run.
- **Rule L3 – Address the reader as "you."** Avoid possessive language ("our," "we").
- **Rule L4 – Write timeless documentation.** Remove wording that anchors the page to a specific calendar moment. Flag phrases such as "currently," "at the time of writing," "as of 2023," "today," "recently," or absolute timestamps that are not required for accuracy. Do **not** flag legitimate use of future or past tense (for example, "will deploy" or "was created") when the action itself occurs in that timeframe; only comment when the wording makes the guidance expire. The usage of before or after a time or event is acceptable when it indicates a condition for the instructions.
- **Rule L5 – Deliver complete sentences with punctuation.** Every suggestion or rewrite must end with ending punctuation. Do not drop punctuation to meet length targets.
- **Rule L6 – Keep sentences concise.** A soft word limit for at 15 characters per sentence to ensure readability while preserving full meaning.
- **Rule L7 – Active voice for procedures.** Use active voice in instructions ("Click Connect") while passive voice remains acceptable in conceptual summaries.



### Formal vs Informal Voice
- **Rule L8 – Default to a formal tone.** Guides, references, and conceptual overviews must use formal language without first-person pronouns, however first person plural pronoun "Let's" is allowed. General contractions are allowed in formal writing (for example, "don't," "it's," "you're") to improve flow, but avoid colloquialisms or slang. Standard speech and writing are acceptable when giving instructions or examples with phrases like "be sure to".
- **Rule L9 - Informal tone is only allowed within standard speech** Super informal language or slang in documentation is not allowed but normal phrases you would use in standard speech and writing are acceptable.

- **Rule L10 – Allow informal tone only in tutorials.** You may use contractions ("let's," "you're") and collaborative phrasing when:
  - The front matter includes `type: tutorial` or a similar tutorial flag, or
  - The file resides in a tutorials directory (for example, `/tutorials/`, `/get-started/`), or
  - The content explicitly walks the reader through a task step by step.  
  When unsure, default to the formal tone.

### Things to Avoid
- Casual language or slang in formal documentation
- Unnecessary jargon without definitions
- Biases, opinions, or emotional language
- Assumptions about the reader's prior knowledge
- Sales or promotional copy
- Do not use exclamation points in formal documentation
- Ignore findings that target code fences, inline code, or terminal snippets—code-language tags and terminal metadata.

## Links
- Add `{target=\_blank}` to external links; internal anchor links on the same page do not need it. The single backslash keeps the underscore literal in Markdown as it will be used in Mkdocs.
- Use descriptive link text that indicates the destination. Avoid "here" or "click here."
- When bolding linked terms, place the formatting outside the link: `**[Term](link){target=\_blank}**`. Remember to only use a single backslash before the underscore.
- Do not apply additional inline formatting (italics or underline) to links.

### Page Structure
- **PS1 – Meta front matter is mandatory.** Every Markdown page must expose `title` and `description` keys in its front matter. Missing keys or empty strings must be reported.
  - `title` must be ≤ 60 characters, summarize the page uniquely, and contain one primary keyword.
  - `description` should be 130–160 characters, written as a single sentence that describes the reader benefit. End with a period. It's best to front-load the most important information so it's visible on all devices.
- **PS2 – H1 alignment.** The visible H1 must exactly match the front-matter `title`. Flag mismatches or multiple H1 headings.
- **PS3 – Heading patterns.** Task headings must be imperative (for example, `Configure the relay`). Concept headings must be noun phrases (for example, `Relay architecture`). Do not allow manually numbered headings (`1. Overview`).

### Lists
- Use unordered lists for items the reader can consume in any order and ordered lists for sequential steps.
- Keep list items parallel in structure and tense.
- Full-sentence list items must end with a period. Fragmentary list items do not take end punctuation.
- When a bulleted or numbered list starts each item with an imperative verb (for example, "Install the tool"), treat every item as a complete instruction and end it with a period even if the wording is brief.
- Do not mix fragments and sentences within the same list. Rewrite items to align with a single structure.
- In procedural ordered lists, start each step with an imperative verb. If a step contains multiple sentences, each sentence needs appropriate punctuation.
- Keep list indentation consistent with surrounding text. Nested lists should be indented an additional two spaces.
- Ensure that bullets all follow similar sentence structure.
- Colons may introduce lists within a list.

## Accessibility and Inclusion
- Maintain a logical heading hierarchy beginning with a single H1.
- Provide descriptive link text instead of "here" or "this."
- Avoid directional references such as "above" or "below"; describe the target element instead.
- Be mindful of pronouns and avoid unnecessarily gendered language.

## Terminology and Capitalization
- For token standards, include a hyphen between the prefix and identifier (for example, `ERC-20`).
- Use `JSON-RPC` instead of `JSON RPC`.
- Use `dApp` instead of `dapp` or `DApp` (except when starting a sentence).
- Prefer "and more" or "and so on" instead of "etc."
- Respect product names and proper nouns; verify against the vendor's branding.
- Common nouns should not be capitalized like parachain, runtime, or smart contract unless they start a sentence.
- Treat the spelling that already appears consistently in the documentation (for example, in navigation files or headings) as the canonical product name. Do not change the casing unless the style guide explicitly documents a different form.
- Apply client-specific terminology overrides from `exceptions.json` (for example, keep `TestNet` in Polkadot docs even though Wormhole content uses `testnet`).

### Chicago Style Reminders
- Capitalize the first and last word in titles and headings.
- Capitalize nouns, pronouns, verbs, adjectives, adverbs, and subordinating conjunctions with four or more letters (for example, While, Because, After).
- Lowercase articles (a, an, the), coordinating conjunctions (and, but, for, or, nor, yet, so), and short prepositions (three letters or fewer) unless they are the first or last word or part of a phrasal verb.
- When multiple Chicago resources disagree, favor capitalization if the word is stressed and four or more letters long. Verify edge cases before recommending a change.

## Punctuation and Sentence Structure
- Use the Oxford comma in lists of three or more items.
- Avoid exclamation marks in formal documentation.
- Use colons to introduce lists when the lead-in is an independent clause.
- Do not use em dashes to replace list item separators; prefer commas or semicolons as appropriate.
- Ensure every declarative sentence ends with a period. Questions must end with a question mark.
- Never remove punctuation simply to shorten a line; rewrite the sentence instead.


### Quotes
- Use double quotation marks in body text.
- Place commas and periods inside the closing quotation mark.
- Use single quotation marks only with code based terms like 'SOL_PRIVATE_KEY', 'helper.ts', or 'pallet_revive' or quotes within quotes.

### Bold
- Wrap bold text in double asterisks (`**bold**`).
- Bold UI elements and terms when introducing a definition list (`**Term**: Definition`).
- Bold inline code terms in description lists when the term itself is inline code.

### Italics
- Wrap italics in single underscores (`_italic_`).
- Use italics sparingly to introduce or emphasize a new term.

### Numbers
- Spell out zero through nine. Use numerals for 10 and above.

## How to Use This Guide

Follow these steps before proposing edits or automated review comments.

### Quick Checklist

1. Identify the document type (tutorial, guide, concept, or reference) by checking the front matter or directory structure.
2. Compose suggestions as complete sentences that include terminating punctuation; aim for concise copy without sacrificing clarity.
3. Provide concrete examples only when they add clarity or are required by the rule; otherwise keep feedback focused on the change.
4. Avoid feedback on code snippets, inline code, or terminal examples.

