const MET_VALUES = {
  Run: 9.8,
  'Trail Run': 11.0,
  Walk: 3.5,
  Hike: 7.0,
  Wheelchair: 5.0
};

export const calculateCalories = (activityType, durationMins, weightKg, intensity) => {
  const met = MET_VALUES[activityType] || 5.0;
  
  // Adjust MET based on intensity
  let intensityMultiplier = 1;
  if (intensity === 'Low') intensityMultiplier = 0.8;
  if (intensity === 'High') intensityMultiplier = 1.2;

  const durationHours = durationMins / 60;
  const calories = met * weightKg * durationHours * intensityMultiplier;
  
  return Math.round(calories);
};
