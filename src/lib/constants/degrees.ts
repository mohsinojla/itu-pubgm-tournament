export const DEGREE_LEVELS = ["BS", "MS", "PhD"] as const;
export type DegreeLevel = (typeof DEGREE_LEVELS)[number];

export const PROGRAMMES_BY_LEVEL: Record<DegreeLevel, readonly string[]> = {
  BS: [
    "BS Computer Science",
    "BS Software Engineering",
    "BS Data Science",
    "BS Artificial Intelligence",
    "BS Cyber Security",
    "BS Computer Engineering",
    "BS Electrical Engineering",
    "BS Mechanical Engineering",
    "BS Civil Engineering",
    "BS Business Administration",
    "BS Economics",
    "BS Mathematics",
    "BS Physics",
  ],
  MS: [
    "MS Computer Science",
    "MS Software Engineering",
    "MS Data Science",
    "MS Computer Engineering",
    "MS Electrical Engineering",
    "MS Business Administration",
  ],
  PhD: [
    "PhD Computer Science",
    "PhD Computer Engineering",
    "PhD Electrical Engineering",
  ],
};

// Flat list kept for schema validation
export const DEGREE_PROGRAMMES = [
  ...PROGRAMMES_BY_LEVEL.BS,
  ...PROGRAMMES_BY_LEVEL.MS,
  ...PROGRAMMES_BY_LEVEL.PhD,
] as const;

export type DegreeProgramme = (typeof DEGREE_PROGRAMMES)[number];

export function maxSemesterForDegree(degree: string): number {
  if (degree.startsWith("MS") || degree.startsWith("PhD")) return 4;
  return 8; // BS
}

export function degreeLevelOf(degree: string): DegreeLevel {
  if (degree.startsWith("PhD")) return "PhD";
  if (degree.startsWith("MS")) return "MS";
  return "BS";
}
