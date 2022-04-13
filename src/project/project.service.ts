import { recoverPersonalSignature } from '@metamask/eth-sig-util';
import { Injectable, Logger } from '@nestjs/common';
import { writeFileSync } from 'fs';
import { getProject, getProjects, saveNewProject } from 'src/db';
import { DBProject, Project } from 'src/models';
import { callTerminal } from 'src/utils';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  startNewProject(project: Project): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const recoveredAddress = recoverPersonalSignature({
        data: project.hash,
        signature: project.signature,
      });

      if (
        recoveredAddress.toLocaleLowerCase() !==
        project.wallet.toLocaleLowerCase()
      ) {
        reject('Can not verify user. Signing failed');
      }

      const dbProject = await getProject(
        project.hash,
        project.wallet,
        project.signature,
      );

      if (dbProject) {
        reject('Project with same name already exists for your account');
      }

      project.svgBase64DataOnly = false;

      const hash = project.hash;
      const signature = project.signature;
      const wallet = project.wallet;

      delete project.wallet;
      delete project.hash;
      delete project.signature;

      const settings = JSON.stringify(project);

      const command = `./scripts/start-new.sh ${hash}`;
      callTerminal(
        command,
        (code, message) => {
          if (code === 0) {
            writeFileSync(`generated/${hash}/.nftartmakerrc.json`, settings);
            saveNewProject(
              project.name,
              hash,
              wallet,
              signature,
            );
          } else {
            resolve(message);
          }
        },
        this.logger,
      );

      resolve('New Project Started Successfully. Status: PENDING');
    });
  }

  getProjects(wallet: string): Promise<Array<DBProject>> {
    return new Promise(async (resolve, reject) => {
      resolve(getProjects(wallet));
    });
  }
}
