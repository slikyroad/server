const level = require("level");

const db = level("./silkroad.db", {
  valueEncoding: "json",
});

/**
 *
 * @param {string} name
 * @param {string} password
 * @returns if project is saved (true) or not (false)
 */
const saveNewProject = async (name, password) => {
  const nfts = [];
  const project = {
    name,
    password,
    nfts,
  };

  await db.put(name, project);

  return true;
};

/**
 *
 * @param {string} name
 * @param {object} nft the nft object to store
 */
const addNft = async (name, nft) => {
  const project = await db.get(name);
  if (!project.nfts) {
    project.nfts = [];
  }

  project.nfts.push(nft);

  await db.put(name, project);
};

/**
 *
 * @param {string} name
 * @param {string} password
 * @param {boolean} auth
 * @returns saved project (or null) if project can't be found
 */
const getProject = async (name, password, auth = true) => {
  console.log(auth);
  const project = await db.get(name);
  if (auth && project && +project.password === +password) {
    return project;
  } else if (!auth) {
    return project;
  }

  return null;
};

module.exports = {
  saveNewProject,
  getProject,
  addNft,
};
