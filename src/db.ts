import level from 'level-ts';
import { DBProject, Stage, Status } from './models';

const db = new level('./silkroad.db');

/**
 *
 * @param name
 * @param password
 * @param signature
 * @returns bool
 */
export const saveNewProject = async (name: string, wallet: string, signature: string): Promise<boolean> => {
  const nfts = [];
  const project: DBProject = {
    name,
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
 * @param name
 * @param password
 * @param signature
 * @returns
 */
export const getProject = async (name: string, wallet: string, signature: string): Promise<DBProject> => {
  try {
    const walletProjects = await db.get(wallet);
    if (walletProjects && walletProjects.length > 0) {
      return walletProjects.find((project) => project.name === name && project.signature === signature);
    }
    return undefined;
  } catch (_err) {
    return undefined;
  }
};

export const updateProjectStatus = async (status: Status, stage: Stage, name: string) => {
  const project: DBProject = await db.get(name);
  project.stage = stage;
  project.status = status;
};
