/**
 * English (US) dictionary — primary language
 */
export const en: Record<string, string> = {
  // Metadata
  "meta.title": "Pocket City Save Editor",
  "meta.description": "The best and only save editor for Pocket City.",

  // Sidebar
  "sidebar.general": "General",
  "sidebar.home": "Home",
  "sidebar.saves": "Saves",
  "sidebar.survival": "Survival",
  "sidebar.survivalGlobalConfig": "Survival Global Config",
  "sidebar.maintenance": "Maintenance",
  "sidebar.backups": "Backups",
  "sidebar.settings": "Settings",

  // Team
  "team.pc2": "Pocket City 2",
  "team.pc2Plan": "Save Editor",
  "team.pc1": "Pocket City",
  "team.pc1Plan": "Coming soon",

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
  "page.saves.description": "Summary of your save slots",
  "page.backups.title": "Backups",
  "page.backups.description": "Manage and restore backups of your saves",
  "page.settings.title": "Settings",
  "page.settings.description":
    "Configure directories monitored for Pocket City saves.",
  "page.survivalConfig.title": "Survival Global Config",
  "page.survivalConfig.description": "Edit survival mode global settings",
  "page.saveDetails.description": "Details of save {name}",

  // Summary cards
  "summary.normalSaves": "Normal Saves",
  "summary.normalSavesDesc": "Total regular save slots",
  "summary.parentSaves": "Parent Saves",
  "summary.parentSavesDesc": "Total regular parent save slots",
  "summary.sandboxSaves": "Sandbox Saves",
  "summary.sandboxSavesDesc": "Total sandbox save slots",
  "summary.parentSandboxSaves": "Parent Sandbox Saves",
  "summary.parentSandboxSavesDesc": "Total sb parent save slots",
  "summary.survivalSaves": "Survival Saves",
  "summary.survivalSavesDesc": "Total survival mode save slots",

  // Card labels
  "card.level": "Level",
  "card.day": "Day",
  "card.dayCampaign": "Day (Campaign)",
  "card.money": "Money",
  "card.parentCities": "Parent Cities",
  "card.unnamedCity": "Unnamed City",

  // Save detail page
  "detail.backToSaves": "Back to saves",
  "detail.childCities": "Child Cities",
  "detail.childCitiesClickToEdit": "Click a city to open the editor",
  "detail.parentCity": "Parent City",
  "detail.generalInfo": "General Information",
  "detail.generalInfoDesc": "Data collected from root file",
  "detail.mapSummary": "Map Summary",
  "detail.mapSummaryDesc": "Save-specific settings",
  "detail.linkedFiles": "Linked Files",
  "detail.linkedFilesDesc": "All files sharing the same group/ID",
  "detail.noLinkedFiles": "No additional files found for this save.",
  "detail.mapSize": "Map Size",
  "detail.dayProgress": "Day Progress",
  "detail.infiniteMoney": "Infinite Money",
  "detail.unlockAll": "Unlock All",
  "detail.maxLevel": "Max Level",
  "detail.fullPath": "Full path",
  "detail.parentCityLabel": "Parent City",
  "detail.difficulty": "Difficulty",
  "detail.sandboxCheats": "Sandbox Cheats",
  "detail.file": "File",
  "detail.size": "Size",
  "detail.modifiedAt": "Modified at",
  "detail.active": "Active",
  "detail.inactive": "Inactive",
  "detail.yes": "Yes",
  "detail.no": "No",

  // Table
  "table.file": "File",
  "table.type": "Type",
  "table.tag": "Tag",
  "table.size": "Size",
  "table.lastModified": "Last modified",
  "table.root": "Root",
  "table.related": "Related",
  "table.dateTime": "Date / time",
  "table.action": "Action",

  // Editor
  "editor.selectFile": "Select file",
  "editor.quickActions": "Quick actions",
  "editor.quickActionsDesc": "Bulk actions applied to this map or all saves",
  "editor.setMaxMap": "Set Max (map)",
  "editor.resetDayMap": "Reset Day (map)",
  "editor.day100Map": "Day 100 (map)",
  "editor.sandboxOnMap": "Sandbox ON (map)",
  "editor.sandboxOffMap": "Sandbox OFF (map)",
  "editor.setMaxAll": "Set Max (all)",
  "editor.deleteSave": "Delete save",
  "editor.generalTab": "General",
  "editor.resourcesTab": "Resources",
  "editor.npcsTab": "NPCs",
  "editor.vehiclesTab": "Vehicles",
  "editor.saveInfo": "Save information",
  "editor.saveInfoDesc": "Edit the fields and click Save.",
  "editor.survivalBadge": "Survival — Sandbox and Level disabled",
  "editor.cityName": "City name",
  "editor.money": "Money",
  "editor.researchPoints": "Research points",
  "editor.day": "Day",
  "editor.dayProgress": "Day progress",
  "editor.difficulty": "Difficulty",
  "editor.level": "Level",
  "editor.disabledSurvival": "(disabled in Survival)",
  "editor.mapSize": "Map Size",
  "editor.cannotDecrease": "(cannot decrease)",
  "editor.sandboxMode": "Sandbox Mode",
  "editor.enabled": "Enabled",
  "editor.disabled": "Disabled",
  "editor.resources": "Resources",
  "editor.resourcesDesc": "Edit the amount of each resource",
  "editor.resourceFallback": "Resource #{id}",
  "editor.npcsTitle": "Relationships (NPCs)",
  "editor.npcsDesc": "Relationship level with each NPC",
  "editor.npcFallback": "NPC #{id}",
  "editor.vehiclesTitle": "Vehicles",
  "editor.vehiclesDesc": "Click to unlock/lock each vehicle",
  "editor.unlockAll": "Unlock All",
  "editor.lockAll": "Lock All",
  "editor.unlocked": "Unlocked",
  "editor.locked": "Locked",
  "editor.saving": "Saving...",
  "editor.saveChanges": "Save changes",
  "editor.reload": "Reload",
  "editor.deleteConfirm": "Are you sure you want to delete this save?",

  // Toasts
  "toast.readError": "Failed to read: {error}",
  "toast.saveSuccess": "Save saved successfully!",
  "toast.saveError": "Error saving: {error}",
  "toast.saveTolerant": "Saved in tolerant mode (structure preserved).",
  "toast.bulkApplied": "Applied to {applied}/{total} saves.",
  "toast.bulkSurvivalSkipped": " {skipped} survival skipped.",
  "toast.bulkError": "Bulk error: {error}",
  "toast.deleteSuccess": "Save deleted (backup created).",
  "toast.deleteError": "Error: {error}",
  "toast.mapSizeWarning":
    "Cannot decrease map size (current: {size}\u00d7{size}).",
  "toast.loadError": "Failed to load: {error}",
  "toast.settingsSaved": "Settings saved successfully!",
  "toast.settingsError": "Error saving: {error}",
  "toast.maxApplied": "Max values applied!",
  "toast.maxError": "Error: {error}",
  "toast.fileDeleted": "File deleted (backup created).",
  "toast.fileDeleteError": "Error: {error}",
  "toast.backupListError": "Error listing backups: {error}",
  "toast.backupRestoreConfirm":
    "Restore this backup? The current file will be replaced.",
  "toast.backupRestored": "Backup restored successfully!",
  "toast.backupRestoreError": "Error restoring: {error}",
  "toast.globalDeleteConfirm":
    "Are you sure you want to delete the global settings file? A backup will be created.",

  // Survival global editor
  "survival.loading": "Loading settings...",
  "survival.fileNotFound":
    "File survival_global_settings not found in the selected directory. It will be created automatically when saving.",
  "survival.readonlyWarning": "Read-only file. Changes cannot be saved.",
  "survival.quickActions": "Quick actions",
  "survival.applyMax": "Apply max values",
  "survival.deleteFile": "Delete file",
  "survival.bestDay": "Best day reached",
  "survival.highestStars": "Highest stars reached",
  "survival.highestPopulation": "Highest population reached",
  "survival.totalUpgradePoints": "Total upgrade points",
  "survival.upgradesSpent": "Upgrades spent",
  "survival.upgradesSpentDesc": "Level of each acquired upgrade",
  "survival.maxLabel": "(max {max})",

  // Backup manager
  "backup.selectSave": "Select save",
  "backup.selectSaveDesc": "Choose a save file to view its backups",
  "backup.searchPlaceholder": "Search by name or file...",
  "backup.noSavesFound": "No saves found.",
  "backup.backupsTitle": "Backups",
  "backup.refresh": "Refresh",
  "backup.backupsDesc":
    "Showing backups of the selected file (max 20 retained)",
  "backup.loading": "Loading...",
  "backup.noBackups": "No backups found for this save.",
  "backup.restore": "Restore",

  // Settings
  "settings.saveDirectories": "Save directories",
  "settings.saveDirectoriesDesc":
    "Manage the folders scanned for Pocket City 2 save files.",
  "settings.addFolderPlaceholder": "Add folder path...",
  "settings.addDirectory": "Add directory",
  "settings.helperText":
    "Enter a path manually or click Add directory to select a folder.",
  "settings.detectedDefault": "Detected default",
  "settings.notDetected": "Not detected",
  "settings.trackedDirectories": "Tracked directories",
  "settings.rescanSaves": "Rescan saves",
  "settings.noDirectories": "No directories added yet.",
  "settings.addFirst": "Add at least one directory before rescanning.",
  "settings.scanning": "Scanning for .es3 saves...",
  "settings.rescanComplete": "Rescan completed at {time}.",

  // No saves
  "noSaves.message":
    "No .es3 saves found. You can set PC2_SAVE_DIRS (or NEXT_PUBLIC_PC2_SAVE_DIRS) to point to your pocketcity2 folder(s), or place saves under ./saves, ./data/pocketcity2 or ./public/pocketcity2 in this workspace.",
  "noSaves.survivalConfig":
    "No Pocket City 2 save directory found. Configure directories in",
  "noSaves.survivalConfigLink": "Settings",

  // Locale
  "locale.en": "English",
  "locale.ptBr": "Português (BR)",
  "locale.language": "Language",

  // Home page
  "home.title": "Home",
  "home.description": "Welcome to Save Editor for Pocket City 1 and 2",
  "home.banner":
    "\ud83d\ude80 Edit saves, money, researches, set day, levels, unlock all cars, NPC relationships, toggle Sandbox, manage Survival global upgrades, and much more... \u2728",
  "home.editWord": "Edit",
  "home.atWarpSpeed": "at Warp Speed",
  "home.subtitle":
    "Edit Pocket City Saves at Warp Speed with our blazing-fast, user-friendly save editor.",
  "home.tagline":
    "Say goodbye to tedious manual edits and hello to instant gratification.",
  "home.cta":
    "Get started now and take your Pocket City experience to the next level! \ud83d\ude80",
  "home.goToSaves": "Go to Saves",
  "home.rotator.money": "Money",
  "home.rotator.npcs": "NPCs",
  "home.rotator.levels": "Levels",
  "home.rotator.days": "Days",
  "home.rotator.upgrades": "Upgrades",
  "home.rotator.researches": "Researches",

  // Dashboard (template page)
  "dashboard.breadcrumb.section": "Building Your Application",
  "dashboard.breadcrumb.page": "Data Fetching",

  // Navigation
  "nav.platform": "Platform",
  "nav.projects": "Projects",
  "nav.more": "More",
  "nav.viewProject": "View Project",
  "nav.shareProject": "Share Project",
  "nav.deleteProject": "Delete Project",
  "nav.upgradeToPro": "Upgrade to Pro",
  "nav.account": "Account",
  "nav.billing": "Billing",
  "nav.notifications": "Notifications",
  "nav.logout": "Log out",

  // Team switcher
  "team.gamesLabel": "Games",

  // Theme
  "theme.toggleAriaLabel": "Toggle theme",
  "theme.switchTo": "Switch to {mode} theme",
  "theme.light": "light",
  "theme.dark": "dark",

  // Settings extras
  "settings.removeAriaLabel": "Remove {directory}",

  // Save details title
  "page.saveDetails.title": "Save Details",
};
