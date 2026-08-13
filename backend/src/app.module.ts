import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { validateEnvConfig } from "./config/env.config";
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { ExercisesModule } from './exercises/exercises.module';
import { RoutinesModule } from './routines/routines.module';
import { WorkoutLogsModule } from './workout-logs/workout-logs.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
   imports: [
      ConfigModule.forRoot({
         isGlobal: true,
         validate: validateEnvConfig,
      }),
      PrismaModule,
      AuthModule,
      ProfileModule,
      ExercisesModule,
      RoutinesModule,
      WorkoutLogsModule,
      AnalyticsModule,
   ],
   controllers: [AppController],
   providers: [AppService],
})
export class AppModule {}
