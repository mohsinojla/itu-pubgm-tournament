import Pusher from "pusher";

let _pusherServer: Pusher | null = null;

export function getPusherServer(): Pusher {
  if (!_pusherServer) {
    _pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER ?? "ap2",
      useTLS: true,
    });
  }
  return _pusherServer;
}

export const pusherServer = {
  trigger: (...args: Parameters<Pusher["trigger"]>) =>
    getPusherServer().trigger(...args),
  triggerBatch: (...args: Parameters<Pusher["triggerBatch"]>) =>
    getPusherServer().triggerBatch(...args),
  authorizeChannel: (...args: Parameters<Pusher["authorizeChannel"]>) =>
    getPusherServer().authorizeChannel(...args),
};
