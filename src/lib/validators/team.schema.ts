import { z } from "zod";

export const createTeamSchema = z.object({
  name: z
    .string()
    .max(24, "Team name must be less than 25 characters")
    .refine(
      (v) => v.trim().split(/\s+/).filter(Boolean).length === 2,
      "Team name must be exactly 2 words (e.g. Shadow Wolves)"
    ),
  logo: z.string().optional(),
});

export const joinRequestSchema = z.object({
  requestedRole: z.enum(["core", "substitute"]),
  message: z.string().max(200).optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type JoinRequestInput = z.infer<typeof joinRequestSchema>;
