export const PUSHER_EVENTS = {
  MATCH_SCHEDULED: "match:scheduled",
  MATCH_LIVE: "match:live",
  MATCH_RESULT: "match:result",
  ANNOUNCEMENT_NEW: "announcement:new",
  HONOUR_UPDATED: "honour:updated",
  NOTIFICATION_NEW: "notification:new",
  JOIN_REQUEST_NEW: "join_request:new",
  JOIN_REQUEST_DECIDED: "join_request:decided",
  MEMBER_REMOVED: "member:removed",
  LEADERSHIP_TRANSFERRED: "leadership:transferred",
  STATS_HIDDEN: "stats:hidden",
  PLAYER_UNREGISTERED: "player:unregistered",
} as const;

export const PUSHER_CHANNELS = {
  tournament: (id: string) => `tournament-${id}`,
  user: (id: string) => `private-user-${id}`,
  team: (id: string) => `private-team-${id}`,
  admins: "presence-admins",
} as const;
