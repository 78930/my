export function calculateMatchScore(skillsWanted: string[], profileSkills: string[]) {
  if (!skillsWanted.length || !profileSkills.length) return 0;
  const wanted = new Set(skillsWanted.map((item) => item.toLowerCase()));
  const matched = profileSkills.filter((item) => wanted.has(item.toLowerCase())).length;
  return Math.round((matched / skillsWanted.length) * 100);
}
