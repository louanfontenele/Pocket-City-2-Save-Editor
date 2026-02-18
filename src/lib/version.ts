/**
 * Application version & changelog
 *
 * Version format: MAJOR.MINOR.PATCH-<short hash>
 * The hash suffix gives each release a unique visual identity.
 */

export type ChangelogEntry = {
  version: string;
  date: string; // ISO date
  changes: {
    en: string[];
    "pt-br": string[];
  };
};

export const APP_VERSION = "1.1.0";
export const BUILD_DATE = "2026-02-17";
export const VERSION_DISPLAY = APP_VERSION;

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.1.0",
    date: "2026-02-17",
    changes: {
      en: [
        "Fixed child save editing — clicking a parent save now correctly loads the child save data instead of the parent's",
        "Added version & changelog page accessible from the sidebar",
        "Added macOS support for save directory detection",
        "Added macOS build target for Electron",
        "Completely redesigned README with emojis, badges, and structured documentation",
        "Fix: Prevent save corruption; backups now preserve original filenames and keep the save structure intact.",
      ],
      "pt-br": [
        "Corrigido edição de saves filhos — clicar em um save parente agora carrega corretamente os dados do save filho ao invés dos dados do pai",
        "Adicionada página de versão e changelog acessível pela sidebar",
        "Adicionado suporte a macOS para detecção do diretório de saves",
        "Adicionado alvo de build para macOS no Electron",
        "README completamente redesenhado com emojis, badges e documentação estruturada",
      ],
    },
  },
  {
    version: "1.0.0",
    date: "2026-02-01",
    changes: {
      en: [
        "Initial release",
        "Save editor with support for money, level, day, resources, NPCs, and cars",
        "Automatic save detection for Pocket City 2 on Windows",
        "Backup and restore system",
        "Survival global config editor",
        "Multi-language support (English & Portuguese)",
        "Dark/light theme toggle",
        "Bulk patch operations for all saves or per group",
      ],
      "pt-br": [
        "Lançamento inicial",
        "Editor de saves com suporte a dinheiro, nível, dia, recursos, NPCs e carros",
        "Detecção automática de saves do Pocket City 2 no Windows",
        "Sistema de backup e restauração",
        "Editor de configuração global do modo Survival",
        "Suporte multi-idioma (Inglês e Português)",
        "Alternância de tema escuro/claro",
        "Operações de patch em massa para todos os saves ou por grupo",
      ],
    },
  },
];
