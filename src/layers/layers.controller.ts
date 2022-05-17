import { Body, Controller, Logger, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response, ResponseUtils } from 'src/project/utils/utils';
import { LayersService } from './layers.service';

@Controller('layers')
export class LayersController {
  private readonly logger = new Logger(LayersController.name);

  constructor(private service: LayersService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('layers'))
  async uploadLayersFile(@UploadedFile() file: Express.Multer.File, @Body() body): Promise<Response> {
    const response = await this.service.uploadLayersFile(file, body);
    return ResponseUtils.getSuccessResponse({}, response);
  }
}
