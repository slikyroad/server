import { recoverPersonalSignature } from '@metamask/eth-sig-util';
import { Injectable, Logger } from '@nestjs/common';
import { writeFileSync } from 'fs';
import { editProject, getProject, getProjects, saveNewProject } from 'src/db';
import { Project } from 'src/models';
import { callTerminal } from 'src/utils';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  editProject(project: Project): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const recoveredAddress = recoverPersonalSignature({
        data: project.hash,
        signature: project.signature,
      });

      if (recoveredAddress.toLocaleLowerCase() !== project.wallet.toLocaleLowerCase()) {
        reject('Can not verify user. Signing failed');
      }

      let dbProject = await getProject(project.hash, project.wallet, project.signature);

      if (!dbProject) {
        reject('Can not find project');
      }

      dbProject = { ...project };

      if (await editProject(dbProject)) {
        resolve('Settings Update Successful');
      } else {
        reject('Settings Update Failed.');
      }
    });
  }

  startNewProject(project: Project): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const recoveredAddress = recoverPersonalSignature({
        data: project.hash,
        signature: project.signature,
      });

      if (recoveredAddress.toLocaleLowerCase() !== project.wallet.toLocaleLowerCase()) {
        reject('Can not verify user. Signing failed');
      }

      let dbProject = await getProject(project.hash, project.wallet, project.signature);

      if (dbProject) {
        reject('Project with same name already exists for your account');
      }

      project.svgBase64DataOnly = false;

      dbProject = { ...project };

      delete project.wallet;
      delete project.hash;
      delete project.signature;

      const settings = JSON.stringify(project);

      const command = `./scripts/start-new.sh ${dbProject.hash}`;
      callTerminal(
        command,
        (code, message) => {
          if (code === 0) {
            writeFileSync(`generated/${dbProject.hash}/.nftartmakerrc.json`, settings);
            saveNewProject(dbProject);
          } else {
            resolve(message);
          }
        },
        this.logger,
      );

      resolve('New Project Started Successfully. Status: PENDING');
    });
  }

  getProjects(wallet: string): Promise<Array<Project>> {
    return new Promise(async (resolve, reject) => {
      resolve(getProjects(wallet));
    });
  }
}
