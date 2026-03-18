const crypto = require('crypto');
const { findUserById, findUserByUsername, createUser } = require('./stores/usersStore');

const SESSION_COOKIE = 'sid';

function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  const parts = String(cookieHeader).split(';');
  for (const p of parts) {
    const [k, ...rest] = p.trim().split('=');
    if (!k) continue;
    out[k] = decodeURIComponent(rest.join('=') || '');
  }
  return out;
}

function setSessionCookie(res, sid) {
  // Dev-friendly cookie. In production, add `Secure`.
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(sid)}; HttpOnly; Path=/; SameSite=Lax`
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`
  );
}

function getSessionUser(req) {
  const cookies = parseCookies(req.headers.cookie);
  const sid = cookies[SESSION_COOKIE];
  if (!sid) return null;
  // Simplest possible session: cookie value is the userId.
  // Not secure for production; intended for local/dev simplicity.
  return findUserById(sid);
}

function requireAuth(req, res, next) {
  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  req.user = { id: user.id, username: user.username };
  return next();
}

function scryptAsync(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt);
  return { salt, hash: derivedKey.toString('hex') };
}

async function verifyPassword(password, salt, hashHex) {
  const derivedKey = await scryptAsync(password, salt);
  const a = Buffer.from(hashHex, 'hex');
  const b = Buffer.from(derivedKey.toString('hex'), 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function signup(username, password) {
  const existing = findUserByUsername(username);
  if (existing) {
    const err = new Error('Username already exists');
    err.status = 409;
    throw err;
  }
  const { salt, hash } = await hashPassword(password);
  const user = { id: crypto.randomUUID(), username, password: { salt, hash }, createdAt: Date.now() };
  createUser(user);
  return { id: user.id, username: user.username };
}

async function login(username, password) {
  const user = findUserByUsername(username);
  if (!user) {
    const err = new Error('Invalid username or password');
    err.status = 401;
    throw err;
  }
  const ok = await verifyPassword(password, user.password?.salt || '', user.password?.hash || '');
  if (!ok) {
    const err = new Error('Invalid username or password');
    err.status = 401;
    throw err;
  }
  return { id: user.id, username: user.username };
}

function createSessionForUser(res, userId) {
  setSessionCookie(res, String(userId));
  return String(userId);
}

function destroySession(req, res) {
  clearSessionCookie(res);
}

module.exports = {
  parseCookies,
  requireAuth,
  getSessionUser,
  signup,
  login,
  createSessionForUser,
  destroySession,
};

