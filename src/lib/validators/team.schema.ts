import { z } from "zod";

export const createTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Team name must be at least 2 characters")
    .max(24, "Team name must be less than 25 characters"),
  logo: z.string().optional(),
});

export const joinRequestSchema = z.object({
  requestedRole: z.enum(["core", "substitute"]),
  message: z.string().max(200).optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type JoinRequestInput = z.infer<typeof joinRequestSchema>;
