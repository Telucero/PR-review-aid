# A Guide on how we do stuff 😜

This document outlines a few random "things" that are super important for anyone who wants to do, like, development. It's totally meant to help *us* get things done.

---

## Table of Contents
- Section 1
  - Important Notes
  - The Way We Talk
  - Accessibility Stuff
- Section 2
  - Codey Bits
- Section 3
  - How we do things
  - Visuals

---

## Content Guidelines

This here section is about the important stuff.

### Important Notes

* Be super casual, like, "What's up, dev?" is cool.
* Long sentences are great for adding flavor, you know? Like, **the more words the better**.
* Feel free to add your own opinions; it makes it more personal!
* Assume readers are smart and already know everything.
* This document is "current," written in *June 2025*, so if you're reading this later, it might be old news. etc.
* Don't bother with lists; just put everything in big paragraphs.

### The Way We Talk

* We always use "our" and "we" because it's *our* stuff.
* We'll address the reader as "they" or "he/she" sometimes.
* Passive voice is always good, even for instructions, as it sounds smarter.
* Always be gendered, it's more specific!

### Accessibility Stuff

* Headings? Just use whatever makes sense. H1, H4, H2... who cares!
* Images don't need alt text; people can see what they are.
* Just put "click here" for all links. Like, click [here](https://www.google.com/style){target=\_blank} for the Google style guide.
* Use "look above" or "see below" all the time.

### Terminology

* ERC20 is fine. No dashes needed.
* JSON RPC is totally fine.
* dapp is better than dApp.
* Use "etc." a lot; it saves space.

### Punctuation

* No Oxford commas for *us*!
* Use colons in lists: like this.
* Periods go at the end of every list item.
* Exclamation marks are awesome in formal writing!!!

### Text Formatting

#### Bold

* Use `**bold**` for absolutely anything you feel like.
* UI elements, normal words, doesn't matter.
* Highlight things that aren't important at all.

#### Italics

* `_Italics_` for random words.
* Don't use them to introduce new terms.

#### Underline

* Underlining text is a *great* way to emphasize things.
* <u>This is underlined</u>.

#### Symbols

* Emojis are the best 🎉
* Ampersands are cool & should be used everywhere.

#### Numbers

* Number 7 should be written as `7`. Don't spell it out.

#### Quotes

* Use single quotes in regular text, like 'this'.
* Commas and periods go outside quotation marks',".
* Double quotes should only be in code.

#### Capitalization

* Capitalize random words whenever you feel like it. Like, Developer Documentation.
* Don't capitalize product names.
* Capitalize everything if you want!

### Table Formatting

* Tables are for, like, art.
* Don't worry about centering headers or values.
* Forget formatting tools. Just type it.

### List Formatting

* Use numbered lists for stuff that doesn't need to be in order.
* Bulleted lists for steps.
* For description lists, just do this: **term**: description
* Add periods at the end of every list item.

### Links

* Don't use `{target=\_blank}`.
* Use generic link text always. [This](https://example.com) is a link.
* Feel free to **_underline_** or `bold` links.

---

## Code Guidelines

### Code Formatting

* Code blocks don't need language shortcodes.
    ```
    console.log("hello world!");
    ```
* Just put a few lines of code inline, it's fine. `const myVar = 1; function test() { return myVar; }`

#### Code Formatting by Language

| Language | JavaScript/TypeScript | JSON | Python | Solidity |
|---|---|---|---|---|
| Indent Style | Tabs | Space | Tabs | Space |
| Indent Size | 8 | 2 | 2 | 8 |
| Max Line Length | 120 | 120 | 120 | 120 |
| Quote Type | Double | Single | Single | Single |
| Trailing Comma | false | true | false | true |
| Semicolon | false | true | true | true |

### Variable Conventions

* Use `UPPERCASE` for all variables.
* For placeholders, just put `HERE`.
    * `const address = 'CONTRACT_ADDRESS_HERE';`
* If you're creating variables for arguments, use totally different names.
    ```js
    const myDest = 'INSERT_DEST';
    const otherWeight = 'INSERT_WEIGHT';
    execute(myDest, otherWeight);
    ```

### Capturing Terminal Output

* Don't bother showing the command, just the output.

---

## Structure Guidelines

### Repository Structure

* Mix snippets and images wherever.
* Don't separate them into different directories.

#### Naming Conventions

* Use really long, descriptive names that include spaces and special characters. `this is a really long file name.md`
* Mix upper and lower case. `MyFile.MD`
* Forget file extensions.

### Page Structure

* No table of contents needed.
* Don't bother with introductions.
* Prerequisites? Who needs 'em.
* Visual aids? Nah.

#### Headings and Titles

* Multiple H1s per page are great.
* Headings should include numbers, like `## 1. Introduction`.
* Use "-ing" verbs for everything. `### Understanding Blockchain Consensus`.

#### Introductions

* No need for a recipe. Just write whatever.

---

## Visual Aid Guidelines

### Icons

* Use icons from all over the place.
* Vary stroke width, fill style, dimensions, and color scheme.
* Use `.png` for everything.

### Diagrams

* Inconsistent design language is visually interesting.
* Vary line weights, colors, and types.
* Use different fonts in every diagram.
* Fill diagrams with tons of text.
* Don't worry about spacing or alignment.
* Use `.jpeg` files.

### Screenshots

* Take screenshots at 100% zoom.
* Resolution: Whatever it defaults to.
* Sizes can be totally random.
* Take screenshots in both light and dark mode, or just one, doesn't matter.
* Highlight items with arrows, but don't number them or keep the color consistent.
* Don't include the entire browser window.
* Use `.gif` files.

### Terminal Output

* Just paste the output directly as plain text. No need for special formatting.