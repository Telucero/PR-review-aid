# Developer Documentation Style Guide

This guide defines the standards and best practices for creating clear, consistent, and accessible technical documentation. It is optimized for automated review agents and human writers alike. When a topic is not covered here, default to the [Google developer documentation style guide](https://developers.google.com/style).

## Table of Contents

- [How to Use This Guide](#how-to-use-this-guide)
  - [Quick Checklist](#quick-checklist)
- [Language and Tone](#language-and-tone)
  - [Clarity and Specificity](#clarity-and-specificity)
  - [Formal vs Informal Voice](#formal-vs-informal-voice)
  - [Things to Avoid](#things-to-avoid)
- [Accessibility and Inclusion](#accessibility-and-inclusion)
- [Terminology and Capitalization](#terminology-and-capitalization)
  - [Chicago Style Reminders](#chicago-style-reminders)
- [Punctuation and Sentence Structure](#punctuation-and-sentence-structure)
  - [Lists](#lists)
  - [Quotes](#quotes)
- [Text Formatting](#text-formatting)
  - [Bold](#bold)
  - [Italics](#italics)
  - [Symbols and Emojis](#symbols-and-emojis)
  - [Numbers](#numbers)
- [Links](#links)
- [Code Guidelines](#code-guidelines)
  - [Code Blocks](#code-blocks)
  - [Code Block Titles](#code-block-titles)
  - [Variable Conventions](#variable-conventions)
  - [Language-Specific Formatting](#language-specific-formatting)
  - [Formatting Profiles](#formatting-profiles)
- [Terminal Content](#terminal-content)
- [Structure Guidelines](#structure-guidelines)
  - [Repository Structure](#repository-structure)
  - [Page Structure](#page-structure)
- [Visual Assets](#visual-assets)
  - [Images and Alt Text](#images-and-alt-text)
  - [Diagrams](#diagrams)
  - [Screenshots](#screenshots)
- [Exception Reference](#exception-reference)

### Quick Checklist

1. Identify the document type (tutorial, guide, concept, or reference) by checking the front matter or directory structure.
2. Compose suggestions as complete sentences that include terminating punctuation; aim for concise copy without sacrificing clarity.
3. Provide concrete examples only when they add clarity or are required by the rule; otherwise keep feedback focused on the change.

## Language and Tone

### Clarity and Specificity

- **Rule L1 – Use a neutral, instructional voice.** Avoid overt marketing claims, superlatives, or promises such as "learn everything you need to know." Descriptive adjectives that state facts about the product are allowed when they can be backed by documentation (for example, "An open-source library that provides powerful XCM tooling" is acceptable if the tooling is demonstrably comprehensive). Prefer declarative sentences that state exactly what the page delivers.  
  Use: `This guide explains how light clients validate blocks on Polkadot.`  
  Avoid: `Learn everything you need to know about light clients on Polkadot.`
- **Rule L2 – Provide context before instructions.** State prerequisites, the goal, or the system state before telling the reader what to click or run.
- **Rule L3 – Address the reader as "you."** Avoid possessive language ("our," "we").
- **Rule L4 – Write timeless documentation.** Omit phrases tied to a specific moment such as "currently" or "at the time of writing."
- **Rule L5 – Deliver complete sentences with punctuation.** Every suggestion or rewrite must end with terminal punctuation. Do not drop punctuation to meet length targets.
- **Rule L6 – Keep sentences concise.** Aim for 60–150 characters per sentence to ensure readability while preserving full meaning.
- **Rule L7 – Active voice for procedures.** Use active voice in instructions ("Click Connect") while passive voice remains acceptable in conceptual summaries.

### Formal vs Informal Voice

- **Rule L8 – Default to a formal tone.** References, and conceptual overviews must use formal language without contractions or first-person plural pronouns.
- **Rule L9 – Allow informal tone only in tutorials and guides.** You may use contractions ("let's," "you're") and collaborative phrasing when:
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

## Accessibility and Inclusion

- Maintain a logical heading hierarchy beginning with a single H1.
- Use descriptive alt text for every image; it must describe what is in the image rather than repeat the surrounding heading.
- Provide descriptive link text instead of "here" or "this."
- Avoid directional references such as "above" or "below"; describe the target element instead.
- Be mindful of pronouns and avoid unnecessarily gendered language.

## Terminology and Capitalization

- For token standards, include a hyphen between the prefix and identifier (for example, `ERC-20`).
- Use `JSON-RPC` instead of `JSON RPC`.
- Use `dApp` instead of `dapp` or `DApp` (except when starting a sentence).
- Prefer "and more" or "and so on" instead of "etc."
- Respect product names and proper nouns; verify against the vendor's branding.
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

### Lists

- Use unordered lists for items the reader can consume in any order and ordered lists for sequential steps.
- Keep list items parallel in structure and tense.
- Full-sentence list items must end with a period. Fragmentary list items do not take end punctuation.
- When a bulleted or numbered list starts each item with an imperative verb (for example, "Install the tool"), treat every item as a complete instruction and end it with a period even if the wording is brief.
- Do not mix fragments and sentences within the same list. Rewrite items to align with a single structure.
- In procedural ordered lists, start each step with an imperative verb. If a step contains multiple sentences, each sentence needs appropriate punctuation.
- Keep list indentation consistent with surrounding text. Nested lists should be indented an additional two spaces.
- Ensure that bullets all follow similar sentence structure.


### Quotes

- Use double quotation marks in body text.
- Place commas and periods inside the closing quotation mark.
- Use single quotation marks only within code examples when required by language conventions or within quotations.

## Text Formatting

### Bold

- Bold UI elements and terms when introducing a definition list (`**Term**: Definition`).
- Bold inline code terms in description lists when the term itself is inline code.

### Italics

- Wrap italics in single underscores (`_italic_`).
- Use italics sparingly to introduce or emphasize a new term.

### Symbols and Emojis

- Do not introduce emojis, emoticons, or ampersands in narrative text unless the UI explicitly requires them.
- Ignore existing emojis inside fenced code blocks or terminal output. Do not flag or remove emojis that are part of sample code, logs, or returned data.

### Numbers

- Spell out zero through nine. Use numerals for 10 and above unless project-specific guidance overrides this rule.

## Links

- Add `{target=\_blank}` to external links; internal anchor links on the same page do not need it. The backslash keeps the underscore literal in Markdown.
- Use descriptive link text that indicates the destination. Avoid "here" or "click here."
- When bolding linked terms, place the formatting outside the link: `**[Term](link){target=\_blank}**`.
- Do not apply additional inline formatting (italics or underline) to links unless project styles require it.

## Code Guidelines

### Code Blocks

- Use inline code (single backticks) for filenames, variables, or short code fragments that do not need to be copied. AI
- Use fenced code blocks for multi-line samples or any code the reader needs to copy. Ai
- Wrap every code block in triple backticks and close it with another triple backtick on its own line with the canonical short code. Ai
- titles with the canonical short code. Ai
- Add the language shortcode that matches the snippet immediately after the opening fence (use the canonical identifier for the language in your theme—for example, `js`, `ts`, `typescript`, `py`, `bash`, `solidity`, `rust`, or `yaml`). Examples:

  ````markdown
  ```js
  import { connect } from '@polkadot/api';
  console.log('Connected');
  ```
  ````
- If the documentation theme supports attributes (such as titles), append them after the language identifier—for example, use ` ```ts title="index.ts"` as the opening fence—and retain them when editing existing blocks.

  ````markdown
  ```ts
  import { ApiPromise } from '@polkadot/api';
  ```
  ````

  ````markdown
  ```py
  print("Hello, Polkadot!")
  ```
  ````

  ````markdown
  ```solidity
  // SPDX-License-Identifier: MIT
  pragma solidity ^0.8.0;
  ```
  ````
- Include required imports so variables and functions are defined within the snippet.
- Treat inline comments inside code (for example, prefixed with `#`, `//`, or `/* */`) as explanatory; do not flag them for tone or punctuation unless the comment itself violates another explicit rule.
- Keep code samples executable. Provide context comments only when necessary to explain a non-obvious step.
- Preserve existing syntax highlighting hints or metadata provided by the documentation framework.

### Code Block Titles

- Documentation sites may use titled code fences, such as adding `title="Relay chain node"` to a bash fence.
- Do not remove or warn about code block titles. They are allowed when supported by the site theme.
- When adding a new titled block, ensure the title succinctly describes the snippet (command, file name, or environment). The attribute appears after the language identifier:

  ````markdown
  ```ts title="index.ts"
  export const main = () => {/* … */}
  ```
  ````

### Variable Conventions

- Use `snake_case` for Python variables and `camelCase` for JavaScript variables.
- Declare root-level variables at the top of the snippet after imports.
- Use uppercase for exported constants only (for example, `export const PRIVATE_KEY = 'INSERT_PRIVATE_KEY';`).
- When users must supply values, create placeholder variables that follow these rules:
  - Describe the value.
  - Use uppercase snake case prefixed with `INSERT`.
  - Wrap the value in quotes if the actual value requires quotes.
  - Avoid generic terms such as `HERE` or `VALUE`.

Correct examples:

```js
const address = 'INSERT_CONTRACT_ADDRESS';
const amount = INSERT_AMOUNT_TO_SEND;
execute(address, amount);
```

### Language-Specific Formatting code

Use the following defaults unless the project specifies otherwise:

| Language | Formatter | Indent Style | Indent Size | Max Line Length | Quote Type | Trailing Comma | Semicolon |
| --- | --- | --- | --- | --- | --- | --- | --- |
| JavaScript / TypeScript | [Prettier](https://prettier.io/) | spaces | 2 | 80 | single | true | true |
| JSON | [Prettier](https://prettier.io/) | spaces | 4 | 80 | double | false | n/a |
| Python | [Black](https://black.readthedocs.io/en/stable/) | spaces | 4 | 80 | double | true | false |
| Solidity | [prettier-plugin-solidity](https://github.com/prettier-solidity/prettier-plugin-solidity?tab=readme-ov-file#vscode) | spaces | 4 | 80 | double | false | false |

### Formatting Profiles code 

```
[*.ts]
indent_style = space
indent_size = 2
max_line_length = 80
quote_type = single

[*.js]
indent_style = space
indent_size = 2
max_line_length = 80
quote_type = single

[*.json]
indent_style = space
indent_size = 4
max_line_length = 80
quote_type = double

[*.html]
max_line_length = off
```

## Terminal Content

Styled terminal components are preferred when the site supports them (for example, [Termynal](https://papermoonio.github.io/demo-docs/builders/get-started/features/#terminal-window)).

- Use terminal snippets for commands and their output when the framework supports the `termynal` component. Otherwise, use fenced `bash` code blocks.
- Show the command that was run, the resulting output, and the blank prompt that indicates control returned to the user.
- Maintain the HTML structure exactly as required by the component:

```html
<div id="termynal" data-termynal>
  <span data-ty="input"><span class="file-path"></span>INSERT_COMMAND</span>
  <span data-ty>INSERT_OUTPUT</span>
  <span data-ty="input"><span class="file-path"></span></span>
</div>
```

- Do not replace terminal snippets with plain code blocks or vice versa without confirming the site's requirements.
- Preserve emojis or special characters that appear in actual terminal output; they help readers verify they ran the correct command.
- When reviewing terminal content, confirm prompts, file paths, and commands match the surrounding instructions.

## Structure Guidelines

### Repository Structure

- Use snippets for repeated text or code and store them in dedicated snippet directories (separate directories for text and code).
- Store all images in a dedicated images directory. Mirror the documentation hierarchy in the snippets and images directories.
- Use descriptive, kebab-case filenames (for example, `hello-world.md`). Avoid spaces and special characters.
- Always use the correct file extension for the content type.

### Page Structure

- Include a table of contents when the platform supports it.
- Begin each page with an H1 title. Provide meta titles and descriptions as required by the platform.
- Introduce the topic with context, explain the current limitations, describe how the feature addresses them, and preview what the guide covers.
- Add a "Check prerequisites" section if readers must complete steps or gather resources before starting.
- Use task-based headings for procedural content (for example, "Create an Instance") and noun phrases for conceptual sections (for example, "Blockchain Consensus Mechanisms").
- Headings should follow a strict hierarchy and should not include numbering unless the platform requires it.

## Visual Assets

### Images and Alt Text

- Provide alt text that describes what the image depicts, including key UI elements or outcomes. Do not reference unrelated sections or products.
- Verify the image filename, caption, and surrounding context before suggesting an alt text change to avoid misidentifying the subject.
- Maintain consistent numbering systems provided in the document. Do not reassign figure numbers or labels to images from other sections.

### Diagrams

- Use a consistent design language, line weight, color palette, and font family.
- Keep shapes and spacing consistent. Document any intentional variations.
- Save diagrams as `.webp` files when possible.

### Screenshots

- Capture screenshots at 150% zoom and 300 DPI resolution.
- Use an average width of 1510px (height varies) to ensure clarity.
- Match the documentation theme (light or dark mode). If both modes are supported, default to dark mode.
- Highlight elements with arrows when necessary. Number multiple arrows and explain them in an ordered list that matches the numbering.
- Include the full browser window, including the address bar.
- Save screenshots as `.webp` files.
