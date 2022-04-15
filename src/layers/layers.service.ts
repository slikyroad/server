import { recoverPersonalSignature } from '@metamask/eth-sig-util';
import { Injectable, Logger } from '@nestjs/common';
import { createReadStream, mkdirSync, rename, rmSync, writeFileSync } from 'fs';
import { editProject, getProject } from 'src/db';
import { Stage, Status } from 'src/models';
import { Readable } from 'stream';
import { Extract } from 'unzipper';

@Injectable()
export class LayersService {
  private readonly logger = new Logger(LayersService.name);

  uploadLayersFile(file: Express.Multer.File, body: any): Promise<string> {
    return new Promise(async (resolve, reject) => {
      if (!file) {
        reject('No file uploaded');
        return;
      }

      const { name, hash, wallet, signature } = body;

      const recoveredAddress = recoverPersonalSignature({
        data: hash,
        signature,
      });

      if (recoveredAddress.toLocaleLowerCase() !== wallet.toLocaleLowerCase()) {
        reject('Can not verify user. Signing failed');
        return;
      }

      let dbProject = await getProject(hash, wallet, signature);

      if (!dbProject) {
        reject('Can not find project');
        return;
      }

      dbProject.stage = Stage.UPLOAD_LAYERS_FILE;
      dbProject.status = Status.PENDING;
      await editProject(dbProject);

      const projectDir = `generated/${hash}`;
      const layersDir = `${projectDir}/layers`;

      rmSync(layersDir, { recursive: true, force: true });
      mkdirSync(layersDir);

      const readStream = Readable.from(file.buffer);

      resolve('File uploaded successfully. Status is PENDING');

      readStream.pipe(Extract({ path: layersDir }));
      readStream.on('close', () => {
        writeFileSync(`${layersDir}/.extracted`, 'success');
        dbProject.status = Status.COMPLETED;
        editProject(dbProject);
      });
    });
  }
}
