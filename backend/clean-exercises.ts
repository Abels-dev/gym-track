import * as fs from 'fs';
import * as path from 'path';

// Define our Enums based on Prisma Schema
enum Category {
  PUSH = 'PUSH',
  PULL = 'PULL',
  LEGS = 'LEGS',
  CORE = 'CORE',
}

enum Equipment {
  BARBELL = 'BARBELL',
  DUMBBELL = 'DUMBBELL',
  MACHINE = 'MACHINE',
  BODYWEIGHT = 'BODYWEIGHT',
  CABLE = 'CABLE',
}

interface RawExercise {
  name: string;
  body_part: string;
  equipment: string;
  instructions: {
    en?: string;
  };
  target: string;
  secondary_muscles: string[];
  gif_url?: string;
  image?: string;
}

const mapCategory = (bodyPart: string, target: string): Category | null => {
  const normalized = bodyPart.toLowerCase();
  const targetNorm = target.toLowerCase();
  
  if (['chest', 'shoulders'].includes(normalized)) return Category.PUSH;
  if (['back'].includes(normalized)) return Category.PULL;
  if (['upper legs', 'lower legs', 'glutes', 'calves'].includes(normalized)) return Category.LEGS;
  if (['waist', 'abs', 'core'].includes(normalized)) return Category.CORE;
  
  // Handle arms which can be Push (triceps) or Pull (biceps, forearms)
  if (['upper arms', 'lower arms'].includes(normalized)) {
    if (['triceps'].includes(targetNorm)) return Category.PUSH;
    if (['biceps', 'forearms'].includes(targetNorm)) return Category.PULL;
  }
  
  return null; // Skip things like neck, cardio
};

const mapEquipment = (equip: string): Equipment | null => {
  const normalized = equip.toLowerCase();
  if (['body weight'].includes(normalized)) return Equipment.BODYWEIGHT;
  if (['barbell'].includes(normalized)) return Equipment.BARBELL;
  if (['dumbbell'].includes(normalized)) return Equipment.DUMBBELL;
  if (['cable'].includes(normalized)) return Equipment.CABLE;
  if (['machine', 'smith machine'].includes(normalized)) return Equipment.MACHINE;
  return null; // Skip bands, kettlebells, medicine balls etc for now
};

async function processExercises() {
  const inputFile = path.join(__dirname, 'exercises.json');
  const outputFile = path.join(__dirname, 'cleaned-exercises.json');

  console.log('Loading raw exercises...');
  const rawData = fs.readFileSync(inputFile, 'utf-8');
  const exercises: RawExercise[] = JSON.parse(rawData);

  console.log(`Loaded ${exercises.length} total exercises. Filtering and mapping...`);

  const cleanedExercises: any[] = [];
  let skippedDueToCategory = 0;
  let skippedDueToEquipment = 0;

  for (const ex of exercises) {
    const category = mapCategory(ex.body_part, ex.target);
    if (!category) {
      skippedDueToCategory++;
      continue;
    }

    const equipment = mapEquipment(ex.equipment);
    if (!equipment) {
      skippedDueToEquipment++;
      continue;
    }
    
    // Only keep if it has english instructions
    if (!ex.instructions || !ex.instructions.en) {
      continue;
    }

    cleanedExercises.push({
      name: ex.name,
      category,
      primaryMuscle: ex.target,
      secondaryMuscles: ex.secondary_muscles,
      equipment,
      instructions: ex.instructions.en,
      videoUrl: ex.gif_url || null,
      imageUrl: ex.image || null,
    });
  }

  console.log(`Skipped ${skippedDueToCategory} exercises due to unsupported body parts (e.g., forearms, neck).`);
  console.log(`Skipped ${skippedDueToEquipment} exercises due to unsupported equipment (e.g., kettlebells, bands).`);
  console.log(`Successfully mapped ${cleanedExercises.length} exercises!`);

  fs.writeFileSync(outputFile, JSON.stringify(cleanedExercises, null, 2));
  console.log(`Saved cleaned data to ${outputFile}`);
}

processExercises().catch(console.error);
