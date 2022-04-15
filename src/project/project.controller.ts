import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { Project } from 'src/models';
import { Response, ResponseUtils } from 'src/utils';
import { ProjectService } from './project.service';

@Controller('project')
export class ProjectController {
  constructor(private service: ProjectService) {}

  @Put()
  async editProject(@Body() project: Project): Promise<Response> {
    const response = await this.service.editProject(project);
    return ResponseUtils.getSuccessResponse([], response);
  }

  @Post()
  async startNewProject(@Body() project: Project): Promise<Response> {
    const response = await this.service.startNewProject(project);
    return ResponseUtils.getSuccessResponse([], response);
  }

  @Get(':wallet')
  async getProjects(@Param('wallet') wallet: string): Promise<Response> {
    const projects = await this.service.getProjects(wallet);
    return ResponseUtils.getSuccessResponse(projects, '');
  }

  @Post('generate')
  async generateNFTs(@Body() body: Project): Promise<Response> {
    const response = await this.service.generateNFTs(body);
    return ResponseUtils.getSuccessResponse([], response);
  }

  @Post('reset')
  async resetProject(@Body() body: Project): Promise<Response> {
    const response = await this.service.resetProject(body);
    return ResponseUtils.getSuccessResponse([], response);
  }
}
