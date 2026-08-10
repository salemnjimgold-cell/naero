function createSecureAuthStorage(secureStorage, legacyStorage) {
  async function getItem(key) {
    const secured = await secureStorage.getItem(key);
    if (secured !== null) return secured;

    const legacy = await legacyStorage.getItem(key);
    if (legacy === null) return null;

    await secureStorage.setItem(key, legacy);
    await legacyStorage.removeItem(key);
    return legacy;
  }

  async function setItem(key, value) {
    await secureStorage.setItem(key, value);
    await legacyStorage.removeItem(key);
  }

  async function removeItem(key) {
    await Promise.allSettled([
      secureStorage.removeItem(key),
      legacyStorage.removeItem(key),
    ]);
  }

  return { getItem, setItem, removeItem };
}

module.exports = { createSecureAuthStorage };
