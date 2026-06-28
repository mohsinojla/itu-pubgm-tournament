export type UserRole = "player" | "admin" | "super_admin";
export type MatchStage = "group" | "quarterfinal" | "semifinal" | "final";
export type MatchStatus = "upcoming" | "live" | "completed" | "cancelled";
export type TournamentStatus = "upcoming" | "group_stage" | "knockout" | "completed";
export type GalleryType = "image" | "video";
export type AnnouncementCategory = "general" | "match" | "result" | "urgent";
export type TeamMemberRole = "core" | "substitute";
export type JoinRequestStatus = "pending" | "approved" | "rejected";
export type NotificationType =
  | "join_request"
  | "join_approved"
  | "join_rejected"
  | "announcement"
  | "match_scheduled"
  | "result_posted"
  | "leadership_transferred"
  | "member_removed"
  | "stats_hidden";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
