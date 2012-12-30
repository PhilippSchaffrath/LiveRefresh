// Generated by CoffeeScript 1.4.0
var connect, disconnect, factory, socketStates, tabFactory, tabHandler;

tabFactory = (function() {

  function tabFactory() {
    this.tabs = [];
    return;
  }

  tabFactory.prototype.addTab = function(tabId) {
    var tab;
    tab = new tabHandler(tabId, this);
    this.tabs[tabId] = tab;
    return tab;
  };

  tabFactory.prototype.removeTab = function(tabId) {
    var tab;
    tab = this.getTab(tabId);
    if (tab !== false) {
      tab.disconnect();
      this.tabs[tabId] = void 0;
    }
  };

  tabFactory.prototype.getTab = function(tabId) {
    if (this.tabs[tabId] === void 0) {
      return false;
    } else {
      return this.tabs[tabId];
    }
  };

  tabFactory.prototype.logTabs = function() {
    console.log(this.tabs);
  };

  return tabFactory;

})();

tabHandler = (function() {

  function tabHandler(tabId, factory, isClosed) {
    this.tabId = tabId;
    this.factory = factory;
    this.isClosed = isClosed != null ? isClosed : false;
  }

  tabHandler.prototype.connect = function(host, port) {
    this.host = host === null || host === "" ? "localhost" : host;
    this.port = port === null || port === "" || port > 65535 || port < 1 ? 1025 : port;
    this.socket = new WebSocket("ws://" + this.host + ":" + this.port);
    this.socket.tabHandler = this;
    this.socket.onopen = function(data) {
      this.tabHandler.setTabIcon();
    };
    this.socket.onclose = function(data) {
      if (!this.tabHandler.getIsClosed()) {
        this.tabHandler.setTabIcon();
      }
      this.tabHandler.factory.removeTab(this.tabHandler.tabId);
    };
    this.socket.onmessage = function(data) {
      if (data.data === "refresh") {
        chrome.tabs.update(this.tabHandler.tabId, {
          selected: true
        });
        chrome.tabs.reload(this.tabHandler.tabId);
      }
    };
    return this.socket.onerror = function(data) {};
  };

  tabHandler.prototype.disconnect = function() {
    return this.socket.close();
  };

  tabHandler.prototype.refreshTab = function() {};

  tabHandler.prototype.setTabIcon = function() {
    var icon;
    icon = "icon.png";
    if (this.socket.readyState === 1) {
      icon = "icon_active.png";
    }
    return chrome.tabs.get(this.tabId, function(tab) {
      if (tab) {
        return chrome.browserAction.setIcon({
          path: "img/" + icon,
          tabId: tab.id
        });
      }
    });
  };

  tabHandler.prototype.getHost = function() {
    return this.host;
  };

  tabHandler.prototype.getPort = function() {
    return this.port;
  };

  tabHandler.prototype.getTab = function() {
    return this.tab;
  };

  tabHandler.prototype.getSocket = function() {
    return this.socket;
  };

  tabHandler.prototype.getIsClosed = function() {
    return this.isClosed;
  };

  tabHandler.prototype.setIsClosed = function(closed) {
    return this.isClosed = closed;
  };

  tabHandler.prototype.getInformation = function() {
    return {
      host: this.host,
      port: this.port
    };
  };

  return tabHandler;

})();

socketStates = (function() {

  function socketStates() {
    this.NONE = 0;
    this.CONNECTING = 1;
    this.CONNECTED = 2;
    this.ERROR = 3;
  }

  return socketStates;

})();

factory = new tabFactory();

connect = function(host, port) {
  return chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function(tabs) {
    var tab;
    tab = factory.addTab(tabs[0].id);
    return tab.connect(host, port);
  });
};

disconnect = function() {
  return chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function(tabs) {
    var tab;
    tab = factory.getTab(tabs[0].id);
    if (tab !== false) {
      return factory.removeTab(tabs[0].id);
    }
  });
};

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  tab = factory.getTab(tabId);
  if (tab !== false) {
    return tab.setTabIcon();
  }
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
  return factory.removeTab(tabId);
});

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function(tabs) {
    var tab;
    tab = factory.getTab(tabs[0].id);
    if (request.command === "getInformation") {
      if (tab !== false) {
        return sendResponse(tab.getInformation());
      }
    }
  });
  return true;
});