"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { getPusherClient } from "@/lib/pusher/client";
import { PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/constants/pusher-events";

const TOURNAMENT_ID = process.env.NEXT_PUBLIC_TOURNAMENT_ID ?? "main";

export default function PusherProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    const pusher = getPusherClient();

    // Subscribe to public tournament channel
    const tournamentChannel = pusher.subscribe(PUSHER_CHANNELS.tournament(TOURNAMENT_ID));

    tournamentChannel.bind(PUSHER_EVENTS.ANNOUNCEMENT_NEW, (data: { title?: string }) => {
      toast(data.title ?? "New announcement!", {
        icon: "📢",
        duration: 5000,
        style: {
          background: "var(--card)",
          color: "var(--text-1)",
          border: "1px solid var(--border)",
        },
      });
    });

    tournamentChannel.bind(PUSHER_EVENTS.MATCH_LIVE, (data: { matchNumber?: number }) => {
      toast(`Match #${data.matchNumber ?? "?"} is now LIVE! 🔥`, {
        duration: 8000,
        style: {
          background: "var(--card)",
          color: "var(--primary)",
          border: "1px solid var(--primary)",
          fontWeight: "bold",
        },
      });
    });

    return () => {
      pusher.unsubscribe(PUSHER_CHANNELS.tournament(TOURNAMENT_ID));
    };
  }, []);

  // Subscribe to private user channel when authenticated
  useEffect(() => {
    if (!session?.user?.id) return;
    const pusher = getPusherClient();
    const userChannel = pusher.subscribe(PUSHER_CHANNELS.user(session.user.id));

    return () => {
      pusher.unsubscribe(PUSHER_CHANNELS.user(session.user.id));
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void userChannel;
  }, [session?.user?.id]);

  return <>{children}</>;
}
