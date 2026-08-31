import { 
  IsArray, 
  IsEnum, 
  IsNumber, 
  IsOptional, 
  Max, 
  Min 
} from 'class-validator';
import { Unit, FitnessGoal, ExperienceLevel, Equipment } from '../../generated/prisma';

export class CreateProfileDto {
  @IsEnum(Unit)
  preferredUnit: Unit;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsEnum(FitnessGoal)
  primaryGoal: FitnessGoal;

  @IsEnum(ExperienceLevel)
  experienceLevel: ExperienceLevel;

  @IsNumber()
  @Min(1)
  @Max(7)
  targetDaysPerWeek: number;

  @IsArray()
  @IsEnum(Equipment, { each: true })
  availableEquipment: Equipment[];
}
