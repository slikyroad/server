import { recoverPersonalSignature } from '@metamask/eth-sig-util';
import { Injectable, Logger } from '@nestjs/common';
import { mkdirSync, rmSync } from 'fs';
import { Stage, Status } from 'src/dtos';
import { ProjectService } from 'src/project/project.service';
import { Readable } from 'stream';
import { Extract } from 'unzipper';

@Injectable()
export class LayersService {
  constructor(private projectService: ProjectService) {}

  private readonly logger = new Logger(LayersService.name);

  uploadLayersFile(file: Express.Multer.File, body: any): Promise<string> {
    return new Promise(async (resolve, reject) => {
      if (!file) {
        reject('No file uploaded');
        return;
      }

      const { hash, wallet, signature } = body;

      const recoveredAddress = recoverPersonalSignature({
        data: hash,
        signature,
      });

      if (recoveredAddress.toLocaleLowerCase() !== wallet.toLocaleLowerCase()) {
        reject('Can not verify user. Signing failed');
        return;
      }

      const dbProject = await this.projectService.findProject(hash, wallet, signature);

      if (!dbProject) {
        reject('Can not find project');
        return;
      }

      dbProject.stage = Stage.UPLOAD_LAYERS_FILE;
      dbProject.status = Status.PENDING;
      dbProject.statusMessage = '';
      await this.projectService.updateProject(dbProject);

      const projectDir = `generated/${hash}`;
      const layersDir = `${projectDir}/layers`;

      rmSync(layersDir, { recursive: true, force: true });
      mkdirSync(layersDir);

      const readStream = Readable.from(file.buffer);

      readStream.pipe(Extract({ path: layersDir }));
      readStream.on('close', () => {
        dbProject.status = Status.COMPLETED;
        this.projectService.updateProject(dbProject);
      });

      resolve('File uploaded successfully. Status is PENDING');
    });
  }
}
