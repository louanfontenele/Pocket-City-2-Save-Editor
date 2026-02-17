/**
 * Português (BR) dictionary — secondary language
 */
export const ptBr: Record<string, string> = {
  // Metadata
  "meta.title": "Pocket City Save Editor",
  "meta.description": "O melhor e único editor de saves para Pocket City.",

  // Sidebar
  "sidebar.general": "Geral",
  "sidebar.home": "Início",
  "sidebar.saves": "Saves",
  "sidebar.survival": "Survival",
  "sidebar.survivalGlobalConfig": "Config Global Survival",
  "sidebar.maintenance": "Manutenção",
  "sidebar.backups": "Backups",
  "sidebar.settings": "Configurações",

  // Team
  "team.pc2": "Pocket City 2",
  "team.pc2Plan": "Editor de Saves",
  "team.pc1": "Pocket City",
  "team.pc1Plan": "Em breve",

  // Categories
  "category.normal": "Normal",
  "category.sandbox": "Sandbox",
  "category.survival": "Survival",

  // Difficulty
  "difficulty.easy": "Easy",
  "difficulty.hard": "Hard",
  "difficulty.expert": "Expert",

  // Pages
  "page.saves.title": "Saves",
  "page.saves.description": "Resumo dos seus slots de save",
  "page.backups.title": "Backups",
  "page.backups.description": "Gerencie e restaure backups dos seus saves",
  "page.settings.title": "Configurações",
  "page.settings.description":
    "Configure os diretórios monitorados para saves do Pocket City.",
  "page.survivalConfig.title": "Config Global Survival",
  "page.survivalConfig.description":
    "Edite as configurações globais do modo Survival",
  "page.saveDetails.description": "Detalhes do save {name}",

  // Summary cards
  "summary.normalSaves": "Saves Normais",
  "summary.normalSavesDesc": "Total de slots de save regulares",
  "summary.parentSaves": "Saves Pai",
  "summary.parentSavesDesc": "Total de slots de save pai regulares",
  "summary.sandboxSaves": "Saves Sandbox",
  "summary.sandboxSavesDesc": "Total de slots de save sandbox",
  "summary.parentSandboxSaves": "Saves Pai Sandbox",
  "summary.parentSandboxSavesDesc": "Total de slots de save pai sandbox",
  "summary.survivalSaves": "Saves Survival",
  "summary.survivalSavesDesc": "Total de slots de save modo survival",

  // Card labels
  "card.level": "Nível",
  "card.day": "Dia",
  "card.dayCampaign": "Dia (Campanha)",
  "card.money": "Dinheiro",
  "card.parentCities": "Cidades Pai",
  "card.unnamedCity": "Cidade sem nome",

  // Save detail page
  "detail.backToSaves": "Voltar para saves",
  "detail.childCities": "Cidades Filhas",
  "detail.childCitiesClickToEdit": "Clique em uma cidade para abrir o editor",
  "detail.parentCity": "Cidade Principal",
  "detail.generalInfo": "Informações Gerais",
  "detail.generalInfoDesc": "Dados coletados do arquivo raiz",
  "detail.mapSummary": "Resumo do Mapa",
  "detail.mapSummaryDesc": "Configurações específicas do save",
  "detail.linkedFiles": "Arquivos vinculados",
  "detail.linkedFilesDesc":
    "Todos os arquivos que compartilham o mesmo grupo/ID",
  "detail.noLinkedFiles": "Nenhum arquivo adicional encontrado para este save.",
  "detail.mapSize": "Tamanho do Mapa",
  "detail.dayProgress": "Progresso do Dia",
  "detail.infiniteMoney": "Dinheiro Infinito",
  "detail.unlockAll": "Desbloquear Tudo",
  "detail.maxLevel": "Nível Máximo",
  "detail.fullPath": "Caminho completo",
  "detail.parentCityLabel": "Cidade Pai",
  "detail.difficulty": "Dificuldade",
  "detail.sandboxCheats": "Cheats Sandbox",
  "detail.file": "Arquivo",
  "detail.size": "Tamanho",
  "detail.modifiedAt": "Modificado em",
  "detail.active": "Ativo",
  "detail.inactive": "Inativo",
  "detail.yes": "Sim",
  "detail.no": "Não",

  // Table
  "table.file": "Arquivo",
  "table.type": "Tipo",
  "table.tag": "Tag",
  "table.size": "Tamanho",
  "table.lastModified": "Última modificação",
  "table.root": "Raiz",
  "table.related": "Relacionado",
  "table.dateTime": "Data / hora",
  "table.action": "Ação",

  // Editor
  "editor.selectFile": "Selecionar arquivo",
  "editor.quickActions": "Ações rápidas",
  "editor.quickActionsDesc":
    "Ações bulk aplicadas a este mapa ou a todos os saves",
  "editor.setMaxMap": "Set Max (mapa)",
  "editor.resetDayMap": "Reset Dia (mapa)",
  "editor.day100Map": "Dia 100 (mapa)",
  "editor.sandboxOnMap": "Sandbox ON (mapa)",
  "editor.sandboxOffMap": "Sandbox OFF (mapa)",
  "editor.setMaxAll": "Set Max (todos)",
  "editor.deleteSave": "Excluir save",
  "editor.generalTab": "Geral",
  "editor.resourcesTab": "Recursos",
  "editor.npcsTab": "NPCs",
  "editor.vehiclesTab": "Veículos",
  "editor.saveInfo": "Informações do save",
  "editor.saveInfoDesc": "Edite os campos e clique em Salvar.",
  "editor.survivalBadge": "Survival — Sandbox e Level desabilitados",
  "editor.cityName": "Nome da cidade",
  "editor.money": "Dinheiro",
  "editor.researchPoints": "Pontos de pesquisa",
  "editor.day": "Dia",
  "editor.dayProgress": "Progresso do dia",
  "editor.difficulty": "Dificuldade",
  "editor.level": "Level",
  "editor.disabledSurvival": "(desabilitado em Survival)",
  "editor.mapSize": "Tamanho do Mapa",
  "editor.cannotDecrease": "(não pode diminuir)",
  "editor.sandboxMode": "Modo Sandbox",
  "editor.enabled": "Ativado",
  "editor.disabled": "Desativado",
  "editor.resources": "Recursos",
  "editor.resourcesDesc": "Edite a quantidade de cada recurso",
  "editor.resourceFallback": "Recurso #{id}",
  "editor.npcsTitle": "Relacionamentos (NPCs)",
  "editor.npcsDesc": "Nível de relacionamento com cada NPC",
  "editor.npcFallback": "NPC #{id}",
  "editor.vehiclesTitle": "Veículos",
  "editor.vehiclesDesc": "Clique para desbloquear/bloquear cada veículo",
  "editor.unlockAll": "Desbloquear Tudo",
  "editor.lockAll": "Bloquear Tudo",
  "editor.unlocked": "Desbloqueado",
  "editor.locked": "Bloqueado",
  "editor.saving": "Salvando...",
  "editor.saveChanges": "Salvar alterações",
  "editor.reload": "Recarregar",
  "editor.deleteConfirm": "Tem certeza que deseja excluir este save?",

  // Toasts
  "toast.readError": "Falha ao ler: {error}",
  "toast.saveSuccess": "Save salvo com sucesso!",
  "toast.saveError": "Erro ao salvar: {error}",
  "toast.saveTolerant": "Salvo em modo tolerante (estrutura preservada).",
  "toast.bulkApplied": "Aplicado em {applied}/{total} saves.",
  "toast.bulkSurvivalSkipped": " {skipped} survival ignorados.",
  "toast.bulkError": "Erro no bulk: {error}",
  "toast.deleteSuccess": "Save excluído (backup criado).",
  "toast.deleteError": "Erro: {error}",
  "toast.mapSizeWarning":
    "Não é permitido diminuir o tamanho do mapa (atual: {size}\u00d7{size}).",
  "toast.loadError": "Falha ao carregar: {error}",
  "toast.settingsSaved": "Configurações salvas com sucesso!",
  "toast.settingsError": "Erro ao salvar: {error}",
  "toast.maxApplied": "Valores máximos aplicados!",
  "toast.maxError": "Erro: {error}",
  "toast.fileDeleted": "Arquivo excluído (backup criado).",
  "toast.fileDeleteError": "Erro: {error}",
  "toast.backupListError": "Erro ao listar backups: {error}",
  "toast.backupRestoreConfirm":
    "Restaurar este backup? O arquivo atual será substituído.",
  "toast.backupRestored": "Backup restaurado com sucesso!",
  "toast.backupRestoreError": "Erro ao restaurar: {error}",
  "toast.globalDeleteConfirm":
    "Tem certeza que deseja excluir o arquivo de configurações globais? Um backup será criado.",

  // Survival global editor
  "survival.loading": "Carregando configurações...",
  "survival.fileNotFound":
    "Arquivo survival_global_settings não encontrado no diretório selecionado. Ao salvar, ele será criado automaticamente.",
  "survival.readonlyWarning":
    "Arquivo somente leitura. Não será possível salvar alterações.",
  "survival.quickActions": "Ações rápidas",
  "survival.applyMax": "Aplicar valores máximos",
  "survival.deleteFile": "Excluir arquivo",
  "survival.bestDay": "Melhor dia alcançado",
  "survival.highestStars": "Maior estrelas alcançadas",
  "survival.highestPopulation": "Maior população alcançada",
  "survival.totalUpgradePoints": "Total de pontos de upgrade",
  "survival.upgradesSpent": "Upgrades gastos",
  "survival.upgradesSpentDesc": "Nível de cada upgrade adquirido",
  "survival.maxLabel": "(máx {max})",

  // Backup manager
  "backup.selectSave": "Selecionar save",
  "backup.selectSaveDesc": "Escolha um arquivo de save para ver seus backups",
  "backup.searchPlaceholder": "Buscar por nome ou arquivo...",
  "backup.noSavesFound": "Nenhum save encontrado.",
  "backup.backupsTitle": "Backups",
  "backup.refresh": "Atualizar",
  "backup.backupsDesc":
    "Mostrando backups do arquivo selecionado (máximo 20 retidos)",
  "backup.loading": "Carregando...",
  "backup.noBackups": "Nenhum backup encontrado para este save.",
  "backup.restore": "Restaurar",

  // Settings
  "settings.saveDirectories": "Diretórios de saves",
  "settings.saveDirectoriesDesc":
    "Gerencie as pastas vasculhadas para arquivos de save do Pocket City 2.",
  "settings.addFolderPlaceholder": "Adicionar caminho da pasta...",
  "settings.addDirectory": "Adicionar diretório",
  "settings.helperText":
    "Insira um caminho manualmente ou clique em Adicionar diretório para selecionar uma pasta.",
  "settings.detectedDefault": "Padrão detectado",
  "settings.notDetected": "Não detectado",
  "settings.trackedDirectories": "Diretórios monitorados",
  "settings.rescanSaves": "Reescanear saves",
  "settings.noDirectories": "Nenhum diretório adicionado ainda.",
  "settings.addFirst": "Adicione pelo menos um diretório antes de reescanear.",
  "settings.scanning": "Buscando saves .es3...",
  "settings.rescanComplete": "Reescaneamento concluído em {time}.",

  // No saves
  "noSaves.message":
    "Nenhum save .es3 encontrado. Defina PC2_SAVE_DIRS (ou NEXT_PUBLIC_PC2_SAVE_DIRS) apontando para sua(s) pasta(s) pocketcity2, ou coloque saves em ./saves, ./data/pocketcity2 ou ./public/pocketcity2 neste workspace.",
  "noSaves.survivalConfig":
    "Nenhum diretório de saves do Pocket City 2 encontrado. Configure os diretórios em",
  "noSaves.survivalConfigLink": "Configurações",

  // Locale
  "locale.en": "English",
  "locale.ptBr": "Português (BR)",
  "locale.language": "Idioma",

  // Home page
  "home.title": "Início",
  "home.description": "Bem-vindo ao Editor de Saves para Pocket City 1 e 2",
  "home.banner":
    "\ud83d\ude80 Edite saves, dinheiro, pesquisas, defina dia, níveis, desbloqueie carros, relacionamentos com NPCs, alterne Sandbox, gerencie upgrades globais de Survival e muito mais... \u2728",
  "home.editWord": "Edite",
  "home.atWarpSpeed": "na Velocidade da Luz",
  "home.subtitle":
    "Edite Saves do Pocket City na Velocidade da Luz com nosso editor ultrarrápido e fácil de usar.",
  "home.tagline":
    "Diga adeus às edições manuais tediosas e olá à gratificação instantânea.",
  "home.cta":
    "Comece agora e leve sua experiência no Pocket City para o próximo nível! \ud83d\ude80",
  "home.goToSaves": "Ir para Saves",
  "home.rotator.money": "Dinheiro",
  "home.rotator.npcs": "NPCs",
  "home.rotator.levels": "Níveis",
  "home.rotator.days": "Dias",
  "home.rotator.upgrades": "Upgrades",
  "home.rotator.researches": "Pesquisas",

  // Dashboard (template page)
  "dashboard.breadcrumb.section": "Construindo sua Aplicação",
  "dashboard.breadcrumb.page": "Busca de Dados",

  // Navigation
  "nav.platform": "Plataforma",
  "nav.projects": "Projetos",
  "nav.more": "Mais",
  "nav.viewProject": "Ver Projeto",
  "nav.shareProject": "Compartilhar Projeto",
  "nav.deleteProject": "Excluir Projeto",
  "nav.upgradeToPro": "Atualizar para Pro",
  "nav.account": "Conta",
  "nav.billing": "Cobrança",
  "nav.notifications": "Notificações",
  "nav.logout": "Sair",

  // Team switcher
  "team.gamesLabel": "Jogos",

  // Theme
  "theme.toggleAriaLabel": "Alternar tema",
  "theme.switchTo": "Mudar para tema {mode}",
  "theme.light": "claro",
  "theme.dark": "escuro",

  // Settings extras
  "settings.removeAriaLabel": "Remover {directory}",

  // Save details title
  "page.saveDetails.title": "Detalhes do Save",
};
