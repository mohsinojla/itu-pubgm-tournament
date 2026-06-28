import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { pusherServer } from "@/lib/pusher/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.text();
  const params = new URLSearchParams(body);
  const socketId = params.get("socket_id");
  const channelName = params.get("channel_name");

  if (!socketId || !channelName) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // Private channels: private-user-[id] and private-team-[id]
  if (channelName.startsWith("private-user-")) {
    const userId = channelName.replace("private-user-", "");
    if (userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Presence channels: presence-admins
  if (channelName === "presence-admins") {
    if (session.user.role !== "admin" && session.user.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const presenceData =
    channelName.startsWith("presence-")
      ? {
          user_id: session.user.id,
          user_info: { name: session.user.name, role: session.user.role },
        }
      : undefined;

  const authResponse = presenceData
    ? pusherServer.authorizeChannel(socketId, channelName, presenceData)
    : pusherServer.authorizeChannel(socketId, channelName);

  return NextResponse.json(authResponse);
}
