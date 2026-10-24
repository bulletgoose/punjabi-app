# Current vocabulary catalog

`data/vocabulary-catalog.js` is the only shipped vocabulary source: 1,562 reviewed, retained lexical records with their live Building Block bindings, dictionary senses, semantic parameters and grammatical forms. It exports the existing central registry format. Shared semantic property patterns are expanded losslessly when loaded. Existing sentence templates are included unchanged.

Old import dictionaries, exclusion ledgers, audit corpora and vocabulary backups are not shipped. No migration reconstructs them. Additions made through the existing editor after this catalog upgrade remain supported.

`catalog-state.js` rebuilds older libraries from this positive catalog. It preserves retained-word enable/deletion settings and identifiable progress, and retains saved sentences only when their vocabulary references can be verified. Unverifiable old saved text, old custom dictionaries, historical aliases and opaque rating histories are discarded. Existing current-catalog edits and additions survive subsequent reloads.

`storage-cleanup.js` removes old app backup chunks and app-managed caches. Speech playback waits for deletion of the previous IndexedDB audio database. The new service worker replaces older app shells and reloads open app pages. Each device must load the updated app online to perform this cleanup. Browser HTTP caches, files exported outside the app and devices that remain offline cannot be remotely erased.

Run the focused checks with `node scripts/run-tests.js`. A static preview can be served with `python3 -m http.server 8000`; use a separate browser origin when testing the destructive upgrade. No runtime translation or AI service is required.

Git history remains unchanged. Repository history and hosting-provider historical versions are outside the current-app cleanup.
