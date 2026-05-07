# Add a URL to the mnemo knowledge base

Fetch the URL provided in $ARGUMENTS, extract the key knowledge, and add it to mnemo.

Steps:
1. Fetch the page at $ARGUMENTS using WebFetch
2. Identify the most useful knowledge: decisions, patterns, API behaviors, constraints, concepts
3. Write a concise, distilled summary (not a raw dump) — focus on what a developer would need to recall
4. Choose a short descriptive title
5. Run: `mnemo add "<distilled content>" --title "<title>"`
6. Confirm what was added and why it is useful
