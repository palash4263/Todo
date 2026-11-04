// localStorage can throw (private mode, blocked storage); treat failures as "not set".
export function getFlag(key) {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

export function setFlag(key) {
  try {
    localStorage.setItem(key, '1');
  } catch {
    /* ignore */
  }
}
