import level from 'level-ts';
import { DBProject, Stage, Status } from './models';

const db = new level('./silkroad.db');

/**
 *
 * @param hash
 * @param password
 * @param signature
 * @returns bool
 */
export const saveNewProject = async (name: string, hash: string, wallet: string, signature: string): Promise<boolean> => {
  const nfts = [];
  const project: DBProject = {
    name,
    hash,
    signature,
    wallet,
    stage: Stage.NEW_PROJECT,
    status: Status.PENDING,
    nfts,
  };

  let walletProjects = [];
  try {
    walletProjects = await db.get(wallet);
  } catch (_err) {}

  if (walletProjects && walletProjects.length > 0) {
    walletProjects.push(project);
  } else {
    walletProjects = [project];
  }

  await db.put(wallet, walletProjects);

  return true;
};

/**
 *
 * @param hash
 * @param password
 * @param signature
 * @returns
 */
export const getProject = async (hash: string, wallet: string, signature: string): Promise<DBProject> => {
  try {
    const walletProjects = await db.get(wallet);
    if (walletProjects && walletProjects.length > 0) {
      return walletProjects.find((project) => project.hash === hash && project.signature === signature);
    }
    return undefined;
  } catch (_err) {
    return undefined;
  }
};

export const getProjects = async (wallet: string): Promise<Array<DBProject>> => {
  try {
    const walletProjects = await db.get(wallet);
    return walletProjects.map(pr => {
      delete pr.signature;
      return pr;
    });
  } catch (_err) {
    return [];
  }
};