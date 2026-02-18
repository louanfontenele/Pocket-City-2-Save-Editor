<p align="center">
  <img src="https://img.shields.io/badge/Pocket%20City%202-Save%20Editor-7c3aed?style=for-the-badge&logo=gamepad&logoColor=white" alt="Pocket City 2 Save Editor" />
  <br/>
  <img src="https://img.shields.io/badge/version-1.1.0-blue?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/electron-36-47848F?style=flat-square&logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/react-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/typescript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" />
</p>

<h1 align="center">⚡ Pocket City 2 Save Editor</h1>

<p align="center">
  <strong>The best and only save editor for Pocket City 2</strong><br/>
  <em>O melhor e único editor de saves para Pocket City 2</em>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-platforms">Platforms</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-development">Development</a> •
  <a href="#-save-locations">Save Locations</a> •
  <a href="#-screenshots">Screenshots</a> •
  <a href="#-changelog">Changelog</a>
</p>

---

## ✨ Features

| Feature                  | Description                                    |
| ------------------------ | ---------------------------------------------- |
| 💰 **Money Editor**      | Set any amount of money for your city          |
| 📈 **Level & Day**       | Adjust city level, day count and day progress  |
| 🔬 **Research Points**   | Modify research points instantly               |
| 🏗️ **Resources**         | Fine-tune all resource amounts                 |
| 👥 **NPC Relationships** | Max out (or reset) relationship levels         |
| 🚗 **Car Unlocks**       | Unlock or lock any vehicle                     |
| 🗺️ **Map Size**          | Change city map dimensions                     |
| 🎮 **Sandbox Toggle**    | Enable/disable sandbox cheats on any save      |
| 🧬 **Survival Config**   | Edit global survival mode settings             |
| 📦 **Bulk Operations**   | Apply changes to all saves or a specific group |
| 💾 **Backup & Restore**  | Automatic backups before every edit            |
| 🌐 **Multi-language**    | English & Português Brasileiro                 |
| 🌙 **Dark/Light Theme**  | Beautiful UI with theme toggle                 |
| 📋 **Changelog**         | Built-in version history & release notes       |

## 🖥️ Platforms

| Platform       | Status       | Save Directory                                                                 |
| -------------- | ------------ | ------------------------------------------------------------------------------ |
| 🪟 **Windows** | ✅ Supported | `%USERPROFILE%/AppData/LocalLow/Codebrew Games Inc_/Pocket City 2/pocketcity2` |
| 🍎 **macOS**   | ✅ Supported | `~/Library/Application Support/Codebrew Games Inc/Pocket City 2/pocketcity2`   |

## 📥 Installation

### Pre-built Releases

Download the latest release for your platform from the [Releases](https://github.com/louanfontenele/Pocket-City-2-Save-Editor/releases) page.

### Build from Source

```bash
# Clone the repository
git clone https://github.com/louanfontenele/Pocket-City-2-Save-Editor.git
cd Pocket-City-2-Save-Editor

# Install dependencies
pnpm install

# Build and run (development)
pnpm electron:dev

# Build for your platform
pnpm electron:build        # Windows (NSIS installer)
pnpm electron:build:mac    # macOS (DMG)
```

## 🛠️ Development

### Prerequisites

- **Node.js** 18+
- **pnpm** 9+
- **Git**

### Quick Start

```bash
# Install dependencies
pnpm install

# Start in dev mode (Vite + Electron)
pnpm electron:dev

# Or run just the web UI (no Electron)
pnpm dev
```

### Project Structure

```
├── electron/           # Electron main process & preload
├── src/
│   ├── components/     # React UI components (shadcn/ui)
│   ├── lib/
│   │   ├── i18n/       # Internationalization (en, pt-br)
│   │   ├── pc2/        # Pocket City 2 game data
│   │   ├── pc2-saves.ts    # Save file I/O (ES3 gzip + JSON5)
│   │   ├── pc2-dirs.ts     # Platform-specific directory detection
│   │   ├── save-utils.ts   # Save classification & display helpers
│   │   └── version.ts      # Version & changelog data
│   └── pages/          # Route pages
├── scripts/            # Build scripts
└── package.json
```

### Tech Stack

| Technology        | Purpose                         |
| ----------------- | ------------------------------- |
| ⚛️ React 19       | UI framework                    |
| 🔷 TypeScript 5   | Type safety                     |
| ⚡ Vite 7         | Build tool & dev server         |
| 🖥️ Electron 36    | Desktop app shell               |
| 🎨 Tailwind CSS 4 | Styling                         |
| 🧩 shadcn/ui      | Component library               |
| 📦 pako           | Gzip compression for .es3 files |
| 🔧 JSON5          | Tolerant JSON parsing           |

## 📂 Save Locations

The editor automatically detects save files in the default Pocket City 2 directories:

### 🪟 Windows

```
%USERPROFILE%\AppData\LocalLow\Codebrew Games Inc_\Pocket City 2\pocketcity2
```

### 🍎 macOS

```
~/Library/Application Support/Codebrew Games Inc/Pocket City 2/pocketcity2
```

> 💡 **Tip:** You can add custom directories in **Settings** if your saves are in a non-standard location.

## 📸 Screenshots

> _Coming soon — contributions welcome!_

## 📋 Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full version history.

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. 🍴 Fork the repository
2. 🔧 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 📝 Open a Pull Request

## 📄 License

This project is open source. See the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ for the Pocket City community
  <br/>
  <sub>Feito com ❤️ para a comunidade do Pocket City</sub>
</p>
