export interface QuickLink {
  label: string;
  path: string;
}

export interface DashboardSettings {
  wallpaperPath: string;
  wallpaperOpacity: number;
  showFileCount: boolean;
  showClock: boolean;
  showSeconds: boolean;
  openOnStartup: boolean;
  quickLinks: QuickLink[];
}

export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = {
  wallpaperPath: "",
  wallpaperOpacity: 0.5,
  showFileCount: true,
  showClock: true,
  showSeconds: false,
  openOnStartup: true,
  quickLinks: [],
};
