export const accessoryWorkouts = {
  UPPER_ACCESSORY: ["Pull-up or lat pulldown 4 sets", "Seated row 3 sets", "Rear delt fly 3 sets", "Pallof press 3 sets", "Light stretch 10 minutes"],
  PULL_ACCESSORY: ["Chest-supported row 4 sets", "Lat pulldown 3 sets", "Face pull 3 sets", "Dead bug 3 sets"],
  PUSH_ACCESSORY: ["Incline dumbbell press 3 sets", "Landmine press 3 sets", "Cable triceps pressdown 3 sets", "Shoulder external rotation 2 sets"],
  LOWER_ACCESSORY: ["Hip thrust 3 controlled sets", "Hamstring curl 3 sets", "Split squat 2 light sets per side", "Calf mobility 8 minutes"],
  CORE_MOBILITY: ["McGill curl-up 3 sets", "Side plank 3 sets per side", "Couch stretch 2 minutes per side", "Thoracic rotation 2 sets"],
  EASY_ZONE2: ["Bike or row 25-35 minutes", "Nasal-breathing pace", "Finish with calves and feet mobility"],
} as const;

export const avoidByConcern = {
  lower: ["Heavy squats", "Deadlifts", "Sled push", "Jumping volume"],
  shoulders: ["Snatch", "Handstand work", "Heavy push press", "High-volume wall balls"],
  lowerBack: ["Heavy hinge work", "High-volume rowing", "Sled pull"],
  calvesFeet: ["Running intervals", "Double unders", "Extra sled push"],
};
