export const PERMISSIONS = {
  MANAGE_PLAYERS: "MANAGE_PLAYERS",
  MANAGE_TEAMS: "MANAGE_TEAMS",
  MANAGE_SCHEDULE: "MANAGE_SCHEDULE",
  MANAGE_RESULTS: "MANAGE_RESULTS",
  MANAGE_GALLERY: "MANAGE_GALLERY",
  POST_ANNOUNCEMENTS: "POST_ANNOUNCEMENTS",
  VIEW_STATS: "VIEW_STATS",
  HIDE_STATS: "HIDE_STATS",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const PERMISSION_LABELS: Record<Permission, string> = {
  MANAGE_PLAYERS: "Manage Players",
  MANAGE_TEAMS: "Manage Teams",
  MANAGE_SCHEDULE: "Manage Schedule",
  MANAGE_RESULTS: "Manage Results",
  MANAGE_GALLERY: "Manage Gallery",
  POST_ANNOUNCEMENTS: "Post Announcements & Edit Rules",
  VIEW_STATS: "View Hidden Stats",
  HIDE_STATS: "Hide Player Stats",
};
