import Team from "@/lib/db/models/Team";
import User from "@/lib/db/models/User";

export async function generateUniqueTeamId(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const id = String(Math.floor(10000 + Math.random() * 90000));
    const exists = await Team.findOne({ teamId: id }).lean();
    if (!exists) return id;
  }
  throw new Error("Could not generate a unique team ID");
}

/**
 * Removes a user from whatever team they're currently in and clears their
 * team fields. If they were the leader, the next member is promoted.
 *
 * Never deletes a team: if the user is the team's only member this returns
 * { ok: false } and changes nothing, so an admin can't accidentally destroy a
 * team (and its registration/stats) just by moving its sole member.
 */
export async function detachUserFromTeam(
  userId: string
): Promise<{ ok: true; team: { _id: string; name: string } | null } | { ok: false; error: string }> {
  const user = await User.findById(userId).select("teamId");
  if (!user?.teamId) return { ok: true, team: null };

  const team = await Team.findById(user.teamId);
  if (!team) {
    // Dangling reference to a team that no longer exists — just clear it.
    await User.findByIdAndUpdate(userId, { $unset: { teamId: "", isTeamLeader: "" } });
    return { ok: true, team: null };
  }

  const others = team.members.filter(
    (m: { userId: { toString: () => string } }) => m.userId.toString() !== userId
  );
  if (others.length === 0) {
    return {
      ok: false,
      error: `This player is the only member of "${team.name}". Add another player to that team first, or delete the team from Team Management.`,
    };
  }

  if (team.leaderId.toString() === userId) {
    team.leaderId = others[0].userId;
    await User.findByIdAndUpdate(others[0].userId, { isTeamLeader: true });
  }
  team.members = others;
  await team.save();

  await User.findByIdAndUpdate(userId, { $unset: { teamId: "", isTeamLeader: "" } });
  return { ok: true, team: { _id: team._id.toString(), name: team.name } };
}
