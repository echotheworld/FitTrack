const generateDemoActivities = () => {
  const activities = [
    {
      id: 'demo-1',
      type: 'Walk',
      distance: 5.2,
      duration: 45,
      steps: 6822, // 5.2 * 1312
      date: '2026-04-21T10:00:00Z',
      calories: 306
    },
    {
      id: 'demo-2',
      type: 'Run',
      distance: 10.4,
      duration: 120,
      steps: 10400, // 10.4 * 1000
      date: '2026-04-22T07:30:00Z',
      calories: 720
    },
    {
      id: 'demo-3',
      type: 'Run',
      distance: 4.3,
      duration: 120,
      steps: 4300,
      date: '2026-04-23T17:15:00Z',
      calories: 310
    },
    {
      id: 'demo-4',
      type: 'Walk',
      distance: 5.9,
      duration: 60,
      steps: 7740,
      date: '2026-04-24T08:00:00Z',
      calories: 348
    },
    {
      id: 'demo-5',
      type: 'Hike',
      distance: 8.2,
      duration: 150,
      steps: 10758,
      date: '2026-04-20T09:00:00Z',
      calories: 580
    },
    {
      id: 'demo-6',
      type: 'Trail Run',
      distance: 6.5,
      duration: 55,
      steps: 6500,
      date: '2026-04-19T06:45:00Z',
      calories: 490
    },
    {
      id: 'demo-7',
      type: 'Walk',
      distance: 3.1,
      duration: 30,
      steps: 4067,
      date: '2026-04-18T18:20:00Z',
      calories: 180
    }
  ];
  
  return activities.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const demoData = {
  firstName: 'Jericho',
  lastName: 'Jan',
  age: '24',
  weight: '72',
  height: '180',
  gender: 'Male',
  activities: generateDemoActivities()
};
