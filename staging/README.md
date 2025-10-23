# Staging Area for LLM Source Files

Drop client LLM exports in this directory (one file at a time). After each upload I’ll parse the file and build/update a consolidated terminology JSON listing key product names, teams, versions, acronyms—anything the model should treat as a recognized term.

Workflow:
1. Copy a single .llms or content dump file into this folder.
2. Let me know which file is ready for processing.
3. I’ll extract the terms and update `staging/clientReference.json` accordingly.
4. Remove or archive the processed dump before adding the next one.

Definitions aren’t required—only canonical spellings and forms. If a term needs extra notes later we can extend the JSON schema.
