const path = require('path');
const { readJson, writeJsonAtomic } = require('../utils/jsonFile');

const STYLE_PROFILES_PATH = path.join(__dirname, '..', 'data', 'style_profiles.json');

function loadStyleProfilesDoc() {
  return readJson(STYLE_PROFILES_PATH, { users: {} });
}

function saveStyleProfilesDoc(doc) {
  writeJsonAtomic(STYLE_PROFILES_PATH, doc);
}

function getStyleProfiles(userId) {
  const doc = loadStyleProfilesDoc();
  const list = doc.users[String(userId)] || [];
  return Array.isArray(list) ? list : [];
}

function setStyleProfiles(userId, profiles) {
  const doc = loadStyleProfilesDoc();
  doc.users[String(userId)] = Array.isArray(profiles) ? profiles : [];
  saveStyleProfilesDoc(doc);
  return doc.users[String(userId)];
}

module.exports = {
  STYLE_PROFILES_PATH,
  loadStyleProfilesDoc,
  saveStyleProfilesDoc,
  getStyleProfiles,
  setStyleProfiles,
};

