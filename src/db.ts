import level from 'level-ts';
import { Project, Stage, Status } from './models';

const db = new level('./silkroad.db');

/**
 *
 * @param hash
 * @param password
 * @param signature
 * @returns bool
 */
export const saveNewProject = async (dbProject): Promise<boolean> => {
  const nfts = [];
  const project: Project = { ...dbProject, stage: Stage.NEW_PROJECT, status: Status.COMPLETED, nfts };

  let walletProjects = [];
  try {
    walletProjects = await db.get(dbProject.wallet);
  } catch (_err) {}

  if (walletProjects && walletProjects.length > 0) {
    walletProjects.push(project);
  } else {
    walletProjects = [project];
  }

  await db.put(dbProject.wallet, walletProjects);

  return true;
};

/**
 *
 * @param hash
 * @param password
 * @param signature
 * @returns
 */
export const getProject = async (hash: string, wallet: string, signature: string): Promise<Project> => {
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

export const getProjects = async (wallet: string): Promise<Array<Project>> => {
  try {
    const walletProjects = await db.get(wallet);
    return walletProjects.map((pr) => {
      delete pr.signature;
      return pr;
    });
  } catch (_err) {
    return [];
  }
};

export const editProject = async (dbProject: Project): Promise<boolean> => {
  let walletProjects = [];
  try {
    walletProjects = await db.get(dbProject.wallet);
  } catch (_err) {
    console.log(_err);
    return false;
  }

  if (walletProjects && walletProjects.length > 0) {
    const index = walletProjects.findIndex((project) => project.hash === dbProject.hash && project.signature === dbProject.signature);
    walletProjects[index] = dbProject;
  } else {
    return false;
  }

  await db.put(dbProject.wallet, walletProjects);

  return true;
};
