const level = require('level')

const db = level('./silkroad.db', {
  valueEncoding: 'json'
});

/**
 * 
 * @param {string} name 
 * @param {string} password 
 * @returns if project is saved (true) or not (false)
 */
const saveNewProject = async (name, password) => {
  await db.put(name, {
    name, password
  });

  return true;
}

/**
 * 
 * @param {string} name 
 * @param {string} password 
 * @returns saved project (or null) if project can't be found
 */
const getProject = async (name, password) => {
  const project = await db.get(name);
  if(project && +project.password === +password)  {
    return project;
  }

  return null;
}

module.exports = {
  saveNewProject,
  getProject
}