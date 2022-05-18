import { recoverPersonalSignature } from '@metamask/eth-sig-util';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createWriteStream, mkdirSync, writeFileSync } from 'fs';
import { DBProject } from 'src/models/project.model';
import { callTerminal, uploadFilesToIpfs } from 'src/project/utils/utils';
import { Repository } from 'typeorm';
import { cloneDeep } from 'lodash';
import { CloudinaryLayerImages, Project, Stage, Status } from 'src/dtos';
import axios from 'axios';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);
  @InjectRepository(DBProject)
  private projectRepository: Repository<DBProject>;

  editProject(project: Project): Promise<string> {
    project.project = '';
    return new Promise(async (resolve, reject) => {
      const recoveredAddress = recoverPersonalSignature({
        data: project.hash,
        signature: project.signature,
      });

      if (recoveredAddress.toLocaleLowerCase() !== project.wallet.toLocaleLowerCase()) {
        reject('Can not verify user. Signing failed');
        return;
      }

      let dbProject = await this.findProject(project.hash, project.wallet, project.signature);

      if (!dbProject) {
        reject('Can not find project');
        return;
      }

      dbProject = { ...project };
      dbProject.project = JSON.stringify(project);
      dbProject.nfts = JSON.stringify(project.nfts);

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

      dbProject.status = Status.COMPLETED;
      if (await this.updateProject(dbProject)) {
        resolve('Settings Update Successful');
      } else {
        reject('Settings Update Failed.');
      }
    });
  }

  uploadToIPFS(body: Project): Promise<string> {
    body.project = '';
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

      const dbProject = await this.findProject(hash, wallet, signature);

      if (!dbProject) {
        reject('Can not find project');
        return;
      }

      dbProject.status = Status.PENDING;
      dbProject.stage = Stage.UPLOAD_TO_IPFS;
      dbProject.statusMessage = '';
      dbProject.project = JSON.stringify(body);
      dbProject.nfts = JSON.stringify(body.nfts);

      this.updateProject(dbProject);

      const nftStorageToken = process.env.NFT_STORAGE_TOKEN;
      uploadFilesToIpfs(dbProject, nftStorageToken, this.projectRepository);

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

      const dbProject = await this.findProject(hash, wallet, signature);

      if (!dbProject) {
        reject('Can not find project');
        return;
      }

      dbProject.status = Status.COMPLETED;
      dbProject.stage = Stage.NEW_PROJECT;
      dbProject.statusMessage = '';
      dbProject.nfts = '';
      dbProject.colllection = '';
      await this.updateProject(dbProject);

      resolve('Project reset successfully');
    });
  }

  generateNFTs(body: Project): Promise<string> {
    body.project = '';
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

      const dbProject = await this.findProject(hash, wallet, signature);

      if (!dbProject) {
        reject('Can not find project');
        return;
      }

      dbProject.stage = Stage.GENERATE_NFTS;
      dbProject.status = Status.PENDING;
      dbProject.statusMessage = '';
      dbProject.project = JSON.stringify(body);
      dbProject.nfts = JSON.stringify(body.nfts);

      await this.updateProject(dbProject);

      await mkdirSync(`generated/${dbProject.hash}/layers`, { recursive: true });

      await this.downloadImages(dbProject, dbProject.cloudinaryFiles, dbProject.hash);

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

      let dbProject = await this.findProject(project.hash, project.wallet, project.signature);

      if (dbProject) {
        reject('Project with same name already exists for your account');
        return;
      }

      project.svgBase64DataOnly = false;

      dbProject = { ...project };
      dbProject.statusMessage = '';
      dbProject.nfts = '';
      dbProject.status = Status.PENDING;
      dbProject.stage = Stage.NEW_PROJECT;
      dbProject.colllection = '';
      dbProject.project = JSON.stringify(project);

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
            dbProject.status = Status.COMPLETED;
            this._addNewProject(dbProject);
          } else {
            dbProject.statusMessage = message;
            dbProject.status = Status.PENDING;
            this.updateProject(dbProject);
            resolve(message);
          }
        },
        this.logger,
      );

      resolve('New Project Started Successfully. Status: PENDING');
    });
  }

  getUserProjects(wallet: string): Promise<Array<DBProject>> {
    return new Promise(async (resolve, reject) => {
      resolve(this._getUserProjects(wallet));
    });
  }

  getProjects(): Promise<Array<DBProject>> {
    return new Promise(async (resolve, reject) => {
      resolve(this._getProjects());
    });
  }

  async findProject(hash: string, wallet: string, signature: string): Promise<any> {
    const project = await this.projectRepository
      .createQueryBuilder('project')
      .where('hash = :hash', { hash: hash })
      .andWhere('wallet = :wallet', { wallet: wallet })
      .andWhere('signature = :signature', { signature: signature })
      .getOne();
    if (project) {
      const parsed = JSON.parse(project.project.toString());
      const mapped = { ...parsed, ...project };
      mapped.project = '';
      return mapped;
    }

    return undefined;
  }

  async updateProject(project: DBProject): Promise<DBProject> {
    const dbProject = await this.findProject(project.hash, project.wallet, project.signature);
    if (!dbProject) {
      throw new Error('Project not found');
    }

    const cloned = cloneDeep(project);
    cloned.id = dbProject.id;
    cloned.status = Status.COMPLETED;
    return this.projectRepository.save(cloned);
  }

  async _getProjects(): Promise<Array<any>> {
    const projects = await this.projectRepository.createQueryBuilder('project').getMany();
    return projects.map((project) => {
      const parsed = JSON.parse(project.project.toString());
      const mapped = { ...parsed, ...project };
      mapped.project = project.project.toString();
      return mapped;
    });
  }

  async _getUserProjects(wallet: string): Promise<Array<any>> {
    const projects = await this.projectRepository.createQueryBuilder('project').where('wallet = :wallet', { wallet: wallet }).getMany();
    return projects.map((project) => {
      const parsed = JSON.parse(project.project.toString());
      const mapped = { ...parsed, ...project };
      mapped.project = project.project.toString();
      return mapped;
    });
  }

  async _addNewProject(project: DBProject): Promise<DBProject> {
    return this.projectRepository.save(project);
  }

  checkImageList(imageList: number, dbProject: any) {
    console.log('Checking Image List: ', imageList);
    if (imageList <= 0) {
      const command = `./scripts/generate.sh ${dbProject.hash}`;

      callTerminal(
        command,
        (code, message) => {
          if (code === 0) {
            dbProject.status = Status.COMPLETED;
          } else {
            dbProject.statusMessage = message;
          }

          this.updateProject(dbProject);
        },
        this.logger,
      );
    }
  }

  async downloadImages(project: any, cloudinaryFiles: Array<CloudinaryLayerImages>, hash: string): Promise<boolean> {
    let imageList = 0;
    cloudinaryFiles.forEach((cf) => {
      imageList += cf.layerImages.length;
    });

    console.log('Image List: ', imageList);

    for (const [_, cloudinaryFile] of cloudinaryFiles.entries()) {
      await mkdirSync(`generated/${hash}/layers/${cloudinaryFile.layerName}`, { recursive: true });
      for (const [i, layerImage] of cloudinaryFile.layerImages.entries()) {
        const imagePath = `generated/${hash}/layers/${cloudinaryFile.layerName}/${cloudinaryFile.originalFileNames[i]}`;
        const url = layerImage;
        console.log(imagePath, url);
        axios({ url, responseType: 'stream' }).then(
          (response) =>
            new Promise((resolve, reject) => {
              response.data
                .pipe(createWriteStream(imagePath))
                .on('finish', () => {
                  resolve(imagePath);
                  imageList--;
                  this.checkImageList(imageList, project);
                })
                .on('error', (e) => reject(e));
            }),
        );
      }
    }

    return false;
  }
}
