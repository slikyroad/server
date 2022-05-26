import { Body, Controller, Get, Logger, Param, Post, Put } from '@nestjs/common';
import { Project } from 'src/dtos';
import { Response, ResponseUtils } from 'src/project/utils/utils';
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
  async getUserProjects(@Param('wallet') wallet: string): Promise<Response> {
    const projects = await this.service.getUserProjects(wallet);
    return ResponseUtils.getSuccessResponse(projects, '');
  }

  @Get()
  async getProjects(): Promise<Response> {
    const projects = await this.service.getProjects();
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

  @Post('ipfs')
  async uploadToIPFS(@Body() body: Project): Promise<Response> {
    const response = await this.service.uploadToIPFS(body);
    return ResponseUtils.getSuccessResponse([], response);
  }

  @Post('nft-bought')
  async nftBought(@Body() body: any): Promise<Response> {
    const response = await this.service.nftBought(body);
    return ResponseUtils.getSuccessResponse(response, '');
  }

  @Get('user-nfts/:wallet')
  async getUserNfts(@Param('wallet') wallet: string) {
    const response = await this.service.getUserNfts(wallet);
    return ResponseUtils.getSuccessResponse(response, '');
  }
}
