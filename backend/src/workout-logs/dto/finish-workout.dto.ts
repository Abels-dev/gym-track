import { IsOptional, IsNumber, IsDateString } from 'class-validator';

export class FinishWorkoutDto {
  @IsOptional()
  @IsDateString()
  endedAt?: string;

  @IsOptional()
  @IsNumber()
  durationSeconds?: number;
}
