export interface DashboardSettings {
  language: "fr" | "en";
  wallpaperPath: string;       // chemin dans le vault ex: "assets/bg.jpg"
  wallpaperOpacity: number;    // 0-1
  showFileCount: boolean;
  showClock: boolean;
  openOnStartup: boolean;
  quickLinks: { label: string; path: string }[];
}

export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings =
{
  language: "fr",
  wallpaperPath: "",
  wallpaperOpacity: 0.4,
  showFileCount: true,
  showClock: true,
  openOnStartup: true,
  quickLinks: [],
};
