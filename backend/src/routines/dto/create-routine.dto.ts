import { Type } from 'class-transformer';
import { IsString, IsOptional, IsArray, ValidateNested, IsInt, Min, IsUUID } from 'class-validator';

export class RoutineExerciseDto {
  @IsUUID()
  exerciseId: string;

  @IsInt()
  @Min(0)
  order: number;

  @IsInt()
  @Min(1)
  targetSets: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  targetRepMin?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  targetRepMax?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  restSeconds?: number;
  
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRoutineDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoutineExerciseDto)
  exercises: RoutineExerciseDto[];
}
