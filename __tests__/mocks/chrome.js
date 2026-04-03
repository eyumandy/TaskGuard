/**
 * Mock Chrome extension APIs for testing.
 *
 * Provides an in-memory implementation of chrome.storage.local,
 * chrome.tabs, chrome.runtime, and chrome.alarms so that
 * background.js session logic can be tested without a real browser.
 */

export function createChromeMock() {
  let storage = {};
  let alarms = {};
  let messageListeners = [];

  const chrome = {
    storage: {
      local: {
        get(keys, callback) {
          const result = {};
          const keyList = Array.isArray(keys) ? keys : [keys];
          for (const key of keyList) {
            if (key in storage) result[key] = storage[key];
          }
          if (callback) callback(result);
          return Promise.resolve(result);
        },
        set(data, callback) {
          Object.assign(storage, data);
          if (callback) callback();
          return Promise.resolve();
        },
        clear(callback) {
          storage = {};
          if (callback) callback();
        },
      },
      onChanged: {
        addListener() {},
      },
    },

    tabs: {
      _tabs: [],
      async get(tabId) {
        return chrome.tabs._tabs.find((t) => t.id === tabId) || { id: tabId, url: "" };
      },
      async query() {
        return chrome.tabs._tabs.filter((t) => t.active);
      },
      async sendMessage() {
        return { received: true };
      },
      onActivated: { addListener() {} },
      onUpdated: { addListener() {} },
    },

    runtime: {
      onMessage: {
        addListener(fn) {
          messageListeners.push(fn);
        },
      },
      sendMessage(msg, callback) {
        if (callback) callback({ success: true });
      },
    },

    alarms: {
      create(name, opts) {
        alarms[name] = opts;
      },
      clear(name) {
        delete alarms[name];
      },
      onAlarm: { addListener() {} },
    },

    webNavigation: {
      onCommitted: { addListener() {} },
    },

    // Test helpers
    _getStorage() {
      return { ...storage };
    },
    _setStorage(data) {
      Object.assign(storage, data);
    },
    _resetStorage() {
      storage = {};
    },
    _getAlarms() {
      return { ...alarms };
    },
  };

  return chrome;
}
