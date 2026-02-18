# 📋 Changelog

All notable changes to this project will be documented in this file.

---

## v1.2 (2026-02-18)

- 🛡️ Fixed save corruption during patch operations by preserving quoted object keys used by Pocket City 2 save format.
- 🔧 Improved ES3 text patching stability (safer block replacement and scalar updates without breaking structure).
- 📦 Preserved gzip inner filename when rewriting `.es3` files.
- 💾 Fixed backup discovery/listing so it correctly maps by `FILE_ID` and keeps original save filenames.
- ⚙️ Fixed `Set Max` behavior so it does not modify map day/time or map size.

## v1.1 (2026-02-17)

- 🐛 Fixed child save editing — clicking a parent save now correctly loads the child data instead of the parent's
- 📋 Added version & changelog page accessible from the sidebar
- 🍎 Added macOS support for save directory detection and build target
- 📝 Completely redesigned README with emojis, badges, and structured documentation
- 🛡️ Fix: Prevent save corruption; backups now preserve original filenames and keep the save structure intact.

## v1.0 (2026-02-01)

- 🎉 Initial release
- 💰 Save editor with support for money, level, day, resources, NPCs, and cars
- 💾 Automatic save detection for Pocket City 2 on Windows
- 📦 Backup and restore system
- 🧬 Survival global config editor
- 🌐 Multi-language support (English & Português Brasileiro)
- 🌙 Dark/light theme toggle
- 📦 Bulk patch operations for all saves or per group
