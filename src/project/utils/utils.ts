import { exec } from 'child_process';
import { readdirSync, readFileSync, rmSync } from 'fs';
import { Status } from 'src/dtos';
import { DBProject } from 'src/models/project.model';
import { Repository } from 'typeorm';
import { storeNftData } from './nft';

export class Utils {
  public static address0 = '0x0000000000000000000000000000000000000000';
  public static getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
}

export class ResponseUtils {
  static getSuccessResponse(data: any, message?: string): Response {
    const r: Response = {
      status: 'success',
      message: message,
      data: data,
    };

    return r;
  }
}

export class Response {
  status: string;
  message: string;
  data: any;
}

export const callTerminal = (command, callback, logger) => {
  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      callback(-1, err.message);
      return;
    }

    if (stderr) {
      callback(-1, stderr);
      logger.error(stderr);
      return;
    }

    logger.log(stdout);
    callback(0, 'success');
  });
};

export const uploadFilesToIpfs = async (body: DBProject, nftStorageToken, repo: Repository<DBProject>) => {
  const imageFiles = readdirSync(`generated/${body.hash}/output/images`);
  const jsonFiles = readdirSync(`generated/${body.hash}/output/json`);
  const ipfsGateway = process.env.IPFS_GATEWAY;

  const nfts = [];
  for (let i = 0; i < imageFiles.length; i++) {
    const imageFile = `generated/${body.hash}/output/images/${imageFiles[i]}`;
    const jsonFile = `generated/${body.hash}/output/json/${jsonFiles[i]}`;

    const fileBlob = readFileSync(imageFile);

    const imageUploadResult = await storeNftData(fileBlob, nftStorageToken);

    const jsonBlob = readFileSync(jsonFile, {
      encoding: 'utf-8',
    });

    const contents = JSON.parse(jsonBlob);
    contents.image = `${ipfsGateway}/${imageUploadResult.cid}`;

    const metaUploadResult = await storeNftData(JSON.stringify(contents, null, 2), nftStorageToken);

    const nft = {
      fileName: imageFiles[i],
      image: `${ipfsGateway}/${imageUploadResult.pin.cid}`,
      metadata: `${ipfsGateway}/${metaUploadResult.pin.cid}`,
    };

    console.log(nft);

    nfts.push(nft);

    body.nfts = JSON.stringify(nfts);

    repo.save(body);

    rmSync(imageFile);
    rmSync(jsonFile);
  }

  body.status = Status.COMPLETED;
  body.statusMessage = '';

  repo.save(body);
};
