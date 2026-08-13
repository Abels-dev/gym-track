import { plainToInstance, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  Matches,
  MinLength,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvConfig {
  @IsEnum(Environment)
  @IsNotEmpty()
  NODE_ENV: Environment;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(32)
  JWT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+[smhd]?$/)
  JWT_EXPIRES_IN: string;

  @IsString()
  @IsNotEmpty()
  EMAIL: string;

  @IsString()
  @IsNotEmpty()
  EMAIL_APP_PASSWORD: string;
}

export function validateEnvConfig(config: Record<string, unknown>): EnvConfig {
  const envConfig = plainToInstance(
    EnvConfig,
    { ...config },
    {
      enableImplicitConversion: true,
    },
  );

  const errors = validateSync(envConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration: ${errors
        .flatMap((error) => Object.values(error.constraints ?? {}))
        .join(', ')}`,
    );
  }

  return envConfig;
}
