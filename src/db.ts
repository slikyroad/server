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
export const saveNewProject = async (
  name: string,
  password: string,
  signature: string,
): Promise<boolean> => {
  const nfts = [];
  const project: DBProject = {
    name,
    password,
    signature,
    stage: Stage.NEW_PROJECT,
    status: Status.PENDING,
    nfts,
  };

  await db.put(name, project);

  return true;
};

/**
 *
 * @param name
 * @param password
 * @param signature
 * @returns
 */
export const getProject = async (
  name: string,
  password: string,
  signature: string,
): Promise<DBProject> => {
  try {
    const project: DBProject = await db.get(name);
    return project;
  } catch (_err) {
    return undefined;
  }
};

export const updateProjectStatus = async (
  status: Status,
  stage: Stage,
  name: string,
) => {
  const project: DBProject = await db.get(name);
  project.stage = stage;
  project.status = status;
};
