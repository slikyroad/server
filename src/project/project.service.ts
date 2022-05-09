import { recoverPersonalSignature } from '@metamask/eth-sig-util';
import { Injectable, Logger } from '@nestjs/common';
import { writeFileSync } from 'fs';
import { editProject, getProject, getProjects, getUserProjects, saveNewProject } from 'src/db';
import { Project, Stage, Status } from 'src/models';
import { callTerminal, uploadFilesToIpfs } from 'src/project/utils/utils';

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
        return;
      }

      let dbProject = await getProject(project.hash, project.wallet, project.signature);

      if (!dbProject) {
        reject('Can not find project');
        return;
      }

      dbProject = { ...project };

      delete project.wallet;
      delete project.hash;
      delete project.signature;
      delete project.nfts;
      delete project.status;
      delete project.stage;
      delete project.statusMessage;
      delete project.price;

      let sumGrowEdition = 0;
      project.layerConfigurations.forEach((lc) => {
        lc.growEditionSizeTo = lc.growEditionSizeTo + sumGrowEdition;
        sumGrowEdition = lc.growEditionSizeTo;
      });

      const settings = JSON.stringify(project);
      writeFileSync(`generated/${dbProject.hash}/.nftartmakerrc.json`, settings);

      if (await editProject(dbProject)) {
        resolve('Settings Update Successful');
      } else {
        reject('Settings Update Failed.');
      }
    });
  }

  uploadToIPFS(body: Project): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const { hash, wallet, signature } = body;

      const recoveredAddress = recoverPersonalSignature({
        data: hash,
        signature,
      });

      if (recoveredAddress.toLocaleLowerCase() !== wallet.toLocaleLowerCase()) {
        reject('Can not verify user. Signing failed');
        return;
      }

      const dbProject = await getProject(hash, wallet, signature);

      if (!dbProject) {
        reject('Can not find project');
        return;
      }

      dbProject.status = Status.PENDING;
      dbProject.stage = Stage.UPLOAD_TO_IPFS;
      dbProject.statusMessage = '';

      editProject(dbProject);

      const nftStorageToken = process.env.NFT_STORAGE_TOKEN;
      uploadFilesToIpfs(dbProject, nftStorageToken);

      resolve('Upload to IPFS Started Successfully');
    });
  }

  resetProject(body: Project): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const { hash, wallet, signature } = body;

      const recoveredAddress = recoverPersonalSignature({
        data: hash,
        signature,
      });

      if (recoveredAddress.toLocaleLowerCase() !== wallet.toLocaleLowerCase()) {
        reject('Can not verify user. Signing failed');
        return;
      }

      const dbProject = await getProject(hash, wallet, signature);

      if (!dbProject) {
        reject('Can not find project');
        return;
      }

      dbProject.status = Status.COMPLETED;
      dbProject.stage = Stage.NEW_PROJECT;
      dbProject.statusMessage = '';
      dbProject.nfts = [];
      dbProject.colllection = '';
      await editProject(dbProject);

      resolve('Project reset successfully');
    });
  }

  generateNFTs(body: Project): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const { hash, wallet, signature } = body;

      const recoveredAddress = recoverPersonalSignature({
        data: hash,
        signature,
      });

      if (recoveredAddress.toLocaleLowerCase() !== wallet.toLocaleLowerCase()) {
        reject('Can not verify user. Signing failed');
        return;
      }

      const dbProject = await getProject(hash, wallet, signature);

      if (!dbProject) {
        reject('Can not find project');
        return;
      }

      dbProject.stage = Stage.GENERATE_NFTS;
      dbProject.status = Status.PENDING;
      dbProject.statusMessage = '';
      await editProject(dbProject);

      const command = `./scripts/generate.sh ${dbProject.hash}`;

      callTerminal(
        command,
        (code, message) => {
          if (code === 0) {
            dbProject.status = Status.COMPLETED;
            editProject(dbProject);
          } else {
            dbProject.statusMessage = message;
            editProject(dbProject);
            resolve(message);
          }
        },
        this.logger,
      );

      resolve('NFT Generate Started Successfully. Status: PENDING');
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
        return;
      }

      let dbProject = await getProject(project.hash, project.wallet, project.signature);

      if (dbProject) {
        reject('Project with same name already exists for your account');
        return;
      }

      project.svgBase64DataOnly = false;

      dbProject = { ...project };
      dbProject.statusMessage = '';

      delete project.wallet;
      delete project.hash;
      delete project.signature;
      delete project.nfts;
      delete project.status;
      delete project.stage;
      delete project.statusMessage;
      delete project.price;

      let sumGrowEdition = 0;
      project.layerConfigurations.forEach((lc) => {
        lc.growEditionSizeTo = lc.growEditionSizeTo + sumGrowEdition;
        sumGrowEdition = lc.growEditionSizeTo;
      });

      const settings = JSON.stringify(project);

      const command = `./scripts/start-new.sh ${dbProject.hash}`;
      callTerminal(
        command,
        (code, message) => {
          if (code === 0) {
            writeFileSync(`generated/${dbProject.hash}/.nftartmakerrc.json`, settings);
            saveNewProject(dbProject);
          } else {
            dbProject.statusMessage = message;
            editProject(dbProject);
            resolve(message);
          }
        },
        this.logger,
      );

      resolve('New Project Started Successfully. Status: PENDING');
    });
  }

  getUserProjects(wallet: string): Promise<Array<Project>> {
    return new Promise(async (resolve, reject) => {
      resolve(getUserProjects(wallet));
    });
  }

  getProjects(): Promise<Array<Project>> {
    return new Promise(async (resolve, reject) => {
      resolve(getProjects());
    });
  }
}
