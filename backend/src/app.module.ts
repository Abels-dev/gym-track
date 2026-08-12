import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { validateEnvConfig } from "./config/env.config";
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';

@Module({
   imports: [
      ConfigModule.forRoot({
         isGlobal: true,
         validate: validateEnvConfig,
      }),
      PrismaModule,
      AuthModule,
      ProfileModule,
   ],
   controllers: [AppController],
   providers: [AppService],
})
export class AppModule {}
