
/**
 * Centralized translation system.
 * - The keys are integers (easier to manage at large scale)
 * - "en" is the 100% reference language
 * - If a key is missing in a language, automatic fallback to "en"
 */

export type Language = "en" | "fr";

//English dictionary (always refer to 100% translation)

const EN: Record<number, string> =
{
  //Core Settings
  1:  "Harmony",
  2:  "Activate or deactivate the modules below. Changes are immediate.",
  3:  "Community",
  4:  "Vote for the next feature",
  5:  "Tell us what you want to see in the next update!",
  6:  "🗳️ Vote",
  7:  "Roadmap",
  8:  "See the next features planned",
  9:  "📋 Roadmap",
  10: "Modules",
  11: "No module available." ,
  12: "ID",
  13: "Language",
  14: "Interface language",

  //Kanban
  100: "Kanban",
  101: "Open Kanban",
  102: "New board",
  103: "Open",
  104: "Delete this board",
  105: "No board. Create one!",
  106: "+ New board",
  107: "Board name",
  108: "Add a task",
  109: "Card title",
  110: "+ column",
  111: "Column name",
  112: "Edit task",
  113: "Title",
  114: "Note link",
  115: "Due date (YYYY-MM-DD)",
  116: "Tags (comma separated)",
  117: "Priority",
  118: "Save",
  119: "Cancel",
  120: "Archive",
  121: "Unarchive",
  122: "Delete",
  123: "Archives",
  124: "Hide the archives",
  125: "No map archived.",
  126: "↩ Unarchive",
  127: "↑ Priority",
  128: "↓ Priority",
  129: "⇅ Priority",
  130: "← Since",
  131: "Delete this board?",
  132: "Confirm",
  133: "In progress",
  134: "To be done",
  135: "Finished",
  136: "Delete this column?",
  137: "← Shift left",
  138: "Shift right →",
  139: "Change color",
  140: "Task Title",
  141: "Delete this task?",
  142: "Urgent",
  143: "High",
  144: "Normal",
  145: "Bass",

  //Dashboard
  200: "Dashboard",
  201: "Open Dashboard",
  202: "Search in vault…",
  203: "No results",
  204: "notes",
  205: "⚙️ Settings",
  206: "Show clock",
  207: "Show seconds",
  208: "Show note count",
  209: "Open on startup",
  210: "Wallpaper",
  211: "Choose…",
  212: "Remove wallpaper",
  213: "Overlay opacity",
  214: "Close",
  215: "None",
  216: "Quick links",
  217: "+ Add",
  218: "Link name",
  219: "Note path",
  220: "Add link",
  221: "Priority Tasks",
  //for time
  250: "Monday",
  251: "Tuesday",
  252: "Wednesday",
  253: "Thursday",
  254: "Friday",
  255: "Saturday",
  256: "Sunday",
  257: "January",
  258: "February",
  259: "March",
  260: "April",
  261: "May",
  262: "June",
  263: "July",
  264: "August",
  265: "September",
  266: "October",
  267: "November",
  268: "December",

  //To-Do List
  300: "My Tasks",
  301: "New Task..."
};

//French dictionary

const FR: Partial<Record<number, string>> =
{
  //Core Settings
  1:  "Harmony",
  2:  "Active ou désactive les modules ci-dessous. Les changements sont immédiats.",
  3:  "Communauté",
  4:  "Voter pour la prochaine feature",
  5:  "Dis-nous ce que tu veux voir dans la prochaine mise à jour !",
  6:  "🗳️ Voter",
  7:  "Roadmap",
  8:  "Voir les prochaines features prévues",
  9:  "📋 Roadmap",
  10: "Modules",
  11: "Aucun module disponible.",
  12: "ID",
  13: "Langue",
  14: "Langue de l'interface",

  //Kanban
  100: "Kanban",
  101: "Ouvrir le Kanban",
  102: "Nouveau tableau",
  103: "Ouvrir",
  104: "Supprimer ce tableau",
  105: "Aucun tableau. Crée-en un !",
  106: "+ Nouveau tableau",
  107: "Nom du tableau",
  108: "Ajouter une tâche",
  109: "Titre de la carte",
  110: "+ colonne",
  111: "Nom de la colonne",
  112: "Éditer la tâche",
  113: "Titre",
  114: "Lien note",
  115: "Échéance (YYYY-MM-DD)",
  116: "Tags (séparés par des virgules)",
  117: "Priorité",
  118: "Enregistrer",
  119: "Annuler",
  120: "Archiver",
  121: "Désarchiver",
  122: "Supprimer",
  123: "Archives",
  124: "Cacher les archives",
  125: "Aucune tâches archivée.",
  126: "↩ Désarchiver",
  127: "↑ Priorité",
  128: "↓ Priorité",
  129: "⇅ Priorité",
  130: "← Depuis",
  131: "Supprimer ce tableau ?",
  132: "Confirmer",
  133: "En cours",
  134: "À faire",
  135: "Terminé",
  136: "Supprimer cette colonne ?",
  137: "← Décaler à gauche",
  138: "Décaler à droite →",
  139: "Changer couleur",
  140: "Titre de la tâche",
  141: "Supprimer cette tâche ?",
  142: "Urgent",
  143: "Haute",
  144: "Normale",
  145: "Basse",
  

  //Dashboard
  200: "Dashboard",
  201: "Ouvrir le Dashboard",
  202: "Rechercher dans le coffre…",
  203: "Aucun résultat",
  204: "notes",
  205: "⚙️ Paramètres",
  206: "Afficher l'horloge",
  207: "Afficher les secondes",
  208: "Afficher le nombre de notes",
  209: "Ouvrir au démarrage",
  210: "Fond d'écran",
  211: "Choisir…",
  212: "Supprimer le fond",
  213: "Opacité overlay",
  214: "Fermer",
  215: "Aucun",
  216: "Liens rapides",
  217: "+ Ajouter",
  218: "Nom du lien",
  219: "Chemin de la note",
  220: "Ajouter le lien",
  221: "Tâches Prioritaires",
  //for time
  250: "Lundi",
  251: "Mardi",
  252: "Mercredi",
  253: "Jeudi",
  254: "Vendredi",
  255: "Samedi",
  256: "Dimanche",
  257: "janvier",
  258: "février",
  259: "mars",
  260: "avril",
  261: "mai",
  262: "juin",
  263: "juillet",
  264: "août",
  265: "septembre",
  266: "octobre",
  267: "novembre",
  268: "decembre",

  //Todo list
  300: "Mes Tâches",
  301: "Nouvelle tâche..."

};

//Language Registry

const TRANSLATIONS: Record<Language, Partial<Record<number, string>>> =
{
  en: EN,
  fr: FR,
};

//current status

let currentLanguage: Language = "en";
const changeListeners: (() => void)[] = [];

// ─── API publique ─────────────────────────────────────────────────────────────

/**
 * Translates a key into the current language.
 * Automatic fallback to EN if the key is missing.
 */

export function t(key: number): string
{
  return TRANSLATIONS[currentLanguage][key] ?? EN[key] ?? `[${key}]`;
}


export function setLanguage(lang: Language): void
{
  currentLanguage = lang;
  for (const l of changeListeners) l();
}

export function getLanguage(): Language
{
  return currentLanguage;
}

/**
 * Subscribes to language changes.
 * Returns an unsubscribe function.
 */

export function onLanguageChange(listener: () => void): () => void
{
  changeListeners.push(listener);
  return () =>
  {
    const i = changeListeners.indexOf(listener);
    if (i !== -1) changeListeners.splice(i, 1);
  };
}