import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateWorkoutLogDto {
  @IsOptional()
  @IsUUID()
  routineId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
