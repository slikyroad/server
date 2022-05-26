import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjectController } from './project/project.controller';
import { ProjectService } from './project/project.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DBProject } from './models/project.model';
import { UserCollection } from './models/user.collection.model';

@Module({
  imports: [ConfigModule.forRoot(), TypeOrmModule.forRoot(), TypeOrmModule.forFeature([DBProject, UserCollection])],
  controllers: [AppController, ProjectController],
  providers: [AppService, ProjectService],
})
export class AppModule {}
