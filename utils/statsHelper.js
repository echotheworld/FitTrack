
export const getMondayOfCurrentWeek = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Monday start
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export const calculateStatsForPeriod = (activities, startDate, endDate = new Date(), currentWorkout = null) => {
  const filtered = activities.filter(a => {
    if (!a || !a.date) return false;
    const date = new Date(a.date);
    return date >= startDate && date <= endDate;
  });

  const stats = filtered.reduce((acc, curr) => ({
    steps: acc.steps + (curr?.steps || 0),
    calories: acc.calories + (curr?.calories || 0),
    duration: acc.duration + (curr?.duration || 0),
    distance: acc.distance + (parseFloat(curr?.distance) || 0),
    activeDaysSet: acc.activeDaysSet.add(new Date(curr.date).toDateString())
  }), { steps: 0, calories: 0, duration: 0, distance: 0, activeDaysSet: new Set() });

  // Add current workout if it falls within the period
  if (currentWorkout) {
    const workoutDate = new Date(currentWorkout.startTime || new Date());
    if (workoutDate >= startDate && workoutDate <= endDate) {
      stats.steps += (currentWorkout.steps || 0);
      stats.calories += (currentWorkout.steps * 0.045 || 0); // Estimate calories for live workout
      stats.duration += (currentWorkout.duration || 0);
      stats.distance += (currentWorkout.distance || 0);
      stats.activeDaysSet.add(workoutDate.toDateString());
    }
  }

  return {
    ...stats,
    activeDays: stats.activeDaysSet.size
  };
};

export const getDailyStats = (activities, targetDate = new Date(), currentWorkout = null) => {
  const dateString = targetDate.toDateString();
  const dailyActivities = activities.filter(a =>
    new Date(a.date).toDateString() === dateString
  );

  const stats = dailyActivities.reduce((acc, curr) => ({
    steps: acc.steps + (curr?.steps || 0),
    calories: acc.calories + (curr?.calories || 0),
    duration: acc.duration + (curr?.duration || 0),
    distance: acc.distance + (parseFloat(curr?.distance) || 0)
  }), { steps: 0, calories: 0, duration: 0, distance: 0 });

  // Add current workout if it's on the target date
  if (currentWorkout) {
    const workoutDate = new Date(currentWorkout.startTime || new Date());
    if (workoutDate.toDateString() === dateString) {
      stats.steps += (currentWorkout.steps || 0);
      stats.calories += (currentWorkout.steps * 0.045 || 0);
      stats.duration += (currentWorkout.duration || 0);
      stats.distance += (currentWorkout.distance || 0);
    }
  }

  return stats;
};

export const calculateStreak = (activities) => {
  if (!activities || activities.length === 0) return 0;

  // Get unique sorted dates (descending)
  const activityDates = [...new Set(activities.map(a => new Date(a.date).toDateString()))]
    .map(d => new Date(d))
    .sort((a, b) => b - a);

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  // Check if the most recent activity is today or yesterday
  const mostRecent = activityDates[0];
  const diffDays = Math.floor((currentDate - mostRecent) / (1000 * 60 * 60 * 24));

  if (diffDays > 1) return 0; // Streak broken

  let checkDate = mostRecent;
  streak = 1;

  for (let i = 1; i < activityDates.length; i++) {
    const prevDate = new Date(checkDate);
    prevDate.setDate(prevDate.getDate() - 1);
    
    if (activityDates[i].toDateString() === prevDate.toDateString()) {
      streak++;
      checkDate = activityDates[i];
    } else {
      break;
    }
  }

  return streak;
};
