import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjectController } from './project/project.controller';
import { ProjectService } from './project/project.service';
import { LayersController } from './layers/layers.controller';
import { LayersService } from './layers/layers.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController, ProjectController, LayersController],
  providers: [AppService, ProjectService, LayersService],
})
export class AppModule {}
