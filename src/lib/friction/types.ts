// Domain types — keep these stable; swapping the backing driver shouldn't change them.

export type FrictionApp = {
  id: string;
  appId: string; // e.g. com.instagram.android
  name: string; // human readable
  waitSeconds: number; // wait before unlock
  durationSeconds: number; // 0 = unlocked until leaving the app; otherwise seconds
  messages: string[]; // lines shown during wait
  reminderEnabled: boolean;
  reminderIntervalMinutes: number;
};

export type ServiceStatus = {
  overlay: boolean;
  accessibility: boolean;
  notifications: boolean;
};

export type ServicePermissionKey = keyof ServiceStatus;

export type InstalledApp = {
  appId: string;
  name: string;
};

export type FrictionAppDraft = Omit<FrictionApp, "id">;
