import { IsOptional, IsInt, IsNumber, Min, IsBoolean } from 'class-validator';

export class UpdateSetDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reps?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  rir?: number;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
