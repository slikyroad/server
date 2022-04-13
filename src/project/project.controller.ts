import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Project } from 'src/models';
import { Response, ResponseUtils } from 'src/utils';
import { ProjectService } from './project.service';

@Controller('project')
export class ProjectController {
    constructor(private service: ProjectService) {}

    @Post('start')
    async startNewProject(@Body() project: Project): Promise<Response> {
        const response = await this.service.startNewProject(project);
        return ResponseUtils.getSuccessResponse([], response);
    }

    @Get(':wallet')
    async getProjects(@Param("wallet") wallet: string): Promise<Response> {
        const projects = await this.service.getProjects(wallet);
        return ResponseUtils.getSuccessResponse(projects, "");
    }
}
