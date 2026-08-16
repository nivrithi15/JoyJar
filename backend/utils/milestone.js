const MILESTONES = {
  5: "First Handful 🌱",
  10: "Blooming 🌷",
  25: "Growing Garden 🌼",
  50: "Overflowing Joy 💛",
};

/** Returns milestone details only when this exact total unlocks one. */
const getMilestone = (memoryCount) => {
  const name = MILESTONES[memoryCount];
  return name ? { count: memoryCount, name } : null;
};

module.exports = { getMilestone, MILESTONES };

