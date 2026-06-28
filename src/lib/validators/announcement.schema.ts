import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  body: z.string().min(1, "Content is required"),
  category: z.enum(["general", "match", "result", "urgent"]).default("general"),
  isPinned: z.boolean().default(false),
  sendEmail: z.boolean().default(false),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;
