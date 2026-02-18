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

export const APP_VERSION = "1.2.0";
export const BUILD_DATE = "2026-02-18";
export const VERSION_DISPLAY = APP_VERSION;

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.2.0",
    date: "2026-02-18",
    changes: {
      en: [
        "Fixed save corruption during patch operations by preserving quoted object keys used by Pocket City 2 save format",
        "Improved ES3 text patching stability with safer block replacement and scalar updates",
        "Preserved gzip inner filename when rewriting .es3 files",
        "Fixed backup discovery/listing to map by FILE_ID while keeping original save filenames",
        "Set Max no longer modifies map day/time or map size",
      ],
      "pt-br": [
        "Corrigida a corrupção de saves durante operações de patch ao preservar chaves de objeto com aspas usadas pelo formato de save do Pocket City 2",
        "Melhorada a estabilidade do patch de texto ES3 com substituição de blocos e atualização de escalares mais seguras",
        "Preservado o nome interno no gzip ao reescrever arquivos .es3",
        "Corrigida a descoberta/listagem de backups para mapear por FILE_ID mantendo os nomes originais dos saves",
        "Set Max não altera mais o dia/horário nem o tamanho do mapa",
      ],
    },
  },
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
        "Correção: evita corrupção de save; backups agora preservam nomes originais dos arquivos e mantêm a estrutura do save intacta.",
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
