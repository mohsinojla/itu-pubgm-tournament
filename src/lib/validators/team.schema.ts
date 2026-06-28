import { z } from "zod";

export const createTeamSchema = z.object({
  name: z
    .string()
    .min(2, "Team name must be at least 2 characters")
    .max(50, "Team name too long"),
  tag: z
    .string()
    .min(2, "Tag must be at least 2 characters")
    .max(5, "Tag max 5 characters")
    .regex(/^[A-Z0-9]+$/i, "Tag can only contain letters and numbers"),
  logo: z.string().optional(),
});

export const joinRequestSchema = z.object({
  requestedRole: z.enum(["core", "substitute"]),
  message: z.string().max(200).optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type JoinRequestInput = z.infer<typeof joinRequestSchema>;
