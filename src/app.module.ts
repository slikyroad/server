import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjectController } from './project/project.controller';
import { ProjectService } from './project/project.service';
import { LayersController } from './layers/layers.controller';
import { LayersService } from './layers/layers.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DBProject } from './models/project.model';

@Module({
  imports: [ConfigModule.forRoot(), TypeOrmModule.forRoot(), TypeOrmModule.forFeature([DBProject])],
  controllers: [AppController, ProjectController, LayersController],
  providers: [AppService, ProjectService, LayersService],
})
export class AppModule {}
