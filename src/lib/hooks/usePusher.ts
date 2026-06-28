"use client";

import { useEffect, useRef } from "react";
import type { Channel } from "pusher-js";
import { getPusherClient } from "@/lib/pusher/client";

export function usePusherChannel(channelName: string | null) {
  const channelRef = useRef<Channel | null>(null);

  useEffect(() => {
    if (!channelName) return;
    const pusher = getPusherClient();
    channelRef.current = pusher.subscribe(channelName);
    return () => {
      pusher.unsubscribe(channelName);
      channelRef.current = null;
    };
  }, [channelName]);

  return channelRef.current;
}

export function usePusherEvent(
  channelName: string | null,
  eventName: string,
  callback: (data: unknown) => void
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!channelName) return;
    const pusher = getPusherClient();
    const channel = pusher.subscribe(channelName);

    const handler = (data: unknown) => callbackRef.current(data);
    channel.bind(eventName, handler);

    return () => {
      channel.unbind(eventName, handler);
      // Only unsubscribe if no other bindings remain
      if (Object.keys(channel.callbacks._callbacks ?? {}).length === 0) {
        pusher.unsubscribe(channelName);
      }
    };
  }, [channelName, eventName]);
}
