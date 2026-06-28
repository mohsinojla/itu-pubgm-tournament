export const DEGREE_PROGRAMMES = [
  // BS — 8 semesters
  "BS Computer Science",
  "BS Software Engineering",
  "BS Data Science",
  "BS Artificial Intelligence",
  "BS Cyber Security",
  "BS Electrical Engineering",
  "BS Mechanical Engineering",
  "BS Civil Engineering",
  "BS Business Administration",
  "BS Economics",
  "BS Mathematics",
  "BS Physics",
  // MS — 4 semesters
  "MS Computer Science",
  "MS Software Engineering",
  "MS Data Science",
  "MS Electrical Engineering",
  "MS Business Administration",
  // PhD — 4 semesters
  "PhD Computer Science",
  "PhD Electrical Engineering",
] as const;

export type DegreeProgramme = (typeof DEGREE_PROGRAMMES)[number];

export function maxSemesterForDegree(degree: string): number {
  if (degree.startsWith("MS") || degree.startsWith("PhD")) return 4;
  return 8; // BS
}

export function degreeLevelOf(degree: string): string {
  if (degree.startsWith("PhD")) return "PhD";
  if (degree.startsWith("MS")) return "MS";
  return "BS";
}
