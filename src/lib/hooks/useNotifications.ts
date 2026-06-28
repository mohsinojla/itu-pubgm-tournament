"use client";

import useSWR from "swr";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { getPusherClient } from "@/lib/pusher/client";
import { PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/constants/pusher-events";

export interface AppNotification {
  _id: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useNotifications() {
  const { data: session } = useSession();
  const { data, mutate } = useSWR(
    session?.user?.id ? "/api/notifications" : null,
    fetcher,
    { refreshInterval: 0 }
  );

  useEffect(() => {
    if (!session?.user?.id) return;
    const pusher = getPusherClient();
    const channelName = PUSHER_CHANNELS.user(session.user.id);
    const channel = pusher.subscribe(channelName);

    channel.bind(PUSHER_EVENTS.NOTIFICATION_NEW, () => {
      mutate();
    });

    return () => {
      channel.unbind(PUSHER_EVENTS.NOTIFICATION_NEW);
      pusher.unsubscribe(channelName);
    };
  }, [session?.user?.id, mutate]);

  return {
    notifications: (data?.notifications ?? []) as AppNotification[],
    unreadCount: (data?.unreadCount ?? 0) as number,
    mutate,
  };
}
