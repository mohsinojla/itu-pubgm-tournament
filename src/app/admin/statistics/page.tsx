import { redirect } from "next/navigation";

// The player leaderboard now lives on the public /statistics page, which shows
// the full list (including hidden players) with the same hide/show controls
// whenever an admin is signed in — no separate admin-only copy to keep in sync.
export default function AdminStatisticsRedirect() {
  redirect("/statistics");
}
