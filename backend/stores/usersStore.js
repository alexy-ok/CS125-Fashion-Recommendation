const path = require('path');
const { readJson, writeJsonAtomic } = require('../utils/jsonFile');

const USERS_PATH = path.join(__dirname, '..', 'data', 'users.json');

function loadUsers() {
  return readJson(USERS_PATH, { users: [] });
}

function saveUsers(doc) {
  writeJsonAtomic(USERS_PATH, doc);
}

function findUserByUsername(username) {
  const { users } = loadUsers();
  return users.find((u) => u.username === username) || null;
}

function findUserById(id) {
  const { users } = loadUsers();
  return users.find((u) => u.id === id) || null;
}

function createUser(user) {
  const doc = loadUsers();
  doc.users.push(user);
  saveUsers(doc);
  return user;
}

module.exports = {
  USERS_PATH,
  loadUsers,
  saveUsers,
  findUserByUsername,
  findUserById,
  createUser,
};

