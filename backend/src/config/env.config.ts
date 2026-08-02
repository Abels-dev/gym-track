import { IsNumber, IsEnum, IsString } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvConfig {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  PORT: number;

  @IsString()
  DATABASE_URL: string;
}

export function validateEnvConfig(config: Record<string, unknown>): EnvConfig {
  const envConfig = new EnvConfig();
  envConfig.NODE_ENV = config.NODE_ENV as Environment;
  envConfig.PORT = Number(config.PORT);
  envConfig.DATABASE_URL = config.DATABASE_URL as string;

  return envConfig;
}
