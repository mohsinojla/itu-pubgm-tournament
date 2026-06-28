// ITU Lahore degree programmes — update with official list when provided
export const DEGREE_PROGRAMMES = [
  "BS Computer Science",
  "BS Software Engineering",
  "BS Data Science",
  "BS Artificial Intelligence",
  "BS Cyber Security",
  "BS Electrical Engineering",
  "BS Mechanical Engineering",
  "BS Civil Engineering",
  "BS Business Administration",
  "BBA",
  "BS Economics",
  "BS Mathematics",
  "BS Physics",
  "MS Computer Science",
  "MS Software Engineering",
  "MS Data Science",
  "MS Electrical Engineering",
  "MS Business Administration",
  "PhD Computer Science",
  "PhD Electrical Engineering",
] as const;

export type DegreeProgramme = (typeof DEGREE_PROGRAMMES)[number];

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export type Semester = (typeof SEMESTERS)[number];
