"use strict";
//initial check and listener
//bars enabled: bkmark, addon, menu
//homepage
//tabs on top

//Question: any pref trees where we should listen for changes?
//Question: should we record all user set prefs? (will have to get cleaned)

const {Cc,Ci} = require("chrome");

/*
let GlobalStateObserver = Class({

})
*/
/*

function PrefListener(branch_name, callback) {
	  // Keeping a reference to the observed preference branch or it will get
	  // garbage collected.
	  var prefService = Cc["@mozilla.org/preferences-service;1"]
	    .getService(Ci.nsIPrefService);
	  this._branch = prefService.getBranch(branch_name);
	  this._branch.QueryInterface(Ci.nsIPrefBranch2);
	  this._callback = callback;
	}

PrefListener.prototype.observe = function(subject, topic, data) {
	  if (topic == 'nsPref:changed')
	    this._callback(this._branch, data);
};

PrefListener.prototype.register = function(trigger) {
this._branch.addObserver('', this, false);
if (trigger) {
let that = this;
this._branch.getChildList('', {}).
  forEach(function (pref_leaf_name)
    { that._callback(that._branch, pref_leaf_name); });
}
};

PrefListener.prototype.unregister = function() {
if (this._branch)
this._branch.removeObserver('', this);
};


// prefs?

//other stuff?



GlobalCombinedObserver.prototype.onExperimentStartup = function(store) {
  GlobalCombinedObserver.superClass.onExperimentStartup.call(this, store);

  // Record study version number.
  this.record(EVENT_CODES.METADATA, "exp startup", "study version",
              exports.experimentInfo.versionNumber);

  // Get the front browser window, use it to record customizations!
  let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
                        .getService(Ci.nsIWindowMediator);
  let frontWindow = wm.getMostRecentWindow("navigator:browser");

  // Are tabs on top?
  let toolbox = frontWindow.document.getElementById("navigator-toolbox");
  let tabPosition = (toolbox.getAttribute("tabsontop") == "true")?"true":"false";
  this.record(EVENT_CODES.CUSTOMIZE, "tab bar", "tabs on top?", tabPosition);

  // Is the main menu bar hidden? (for unified Firefox Menu Bar on Windows)
  let toolbarMenubar = frontWindow.document.getElementById("toolbar-menubar");
  let autohide = toolbarMenubar.getAttribute("autohide");
  this.record(EVENT_CODES.CUSTOMIZE, "menu bar", "hidden?",
              (autohide == "true")?"true":"false");

  // How many bookmarks in bookmark toolbar? Is bookmark toolbar shown?
  let bkmks = frontWindow.document.getElementById("PlacesToolbarItems").childNodes;
  this.record(EVENT_CODES.CUSTOMIZE, "bookmark bar", "num. bookmarks",
              bkmks.length);
  let bkmkToolbar = frontWindow.document.getElementById("personal-bookmarks");
  this.record(EVENT_CODES.CUSTOMIZE, "bookmark bar", "hidden?",
              "" + !!bkmkToolbar.parentNode.collapsed);

  // Is addon bar shown?
  let addonBar = frontWindow.document.getElementById("addon-bar");
  this.record(EVENT_CODES.CUSTOMIZE, "addon bar", "hidden?", addonBar.collapsed);

  // TODO Any change to toolbar buttons? (Copy code from toolbar study
  // and see if user has added/removed/reoredered)


  // Is Sync set up? What's the last time it synced?
  let syncName = prefs.get("services.sync.username", "");
  this.record(EVENT_CODES.CUSTOMIZE, "Sync", "Configured?",
              (syncName == "")?"False":"True");
  let lastSync = prefs.get("services.sync.lastSync", 0);
  this.record(EVENT_CODES.CUSTOMIZE, "Sync", "Last Sync Time", lastSync);

  // What search engine is set in the search bar?
  let searchbarengine = frontWindow.document.getElementById("searchbar").currentEngine.name;
  this.record(EVENT_CODES.CUSTOMIZE, "Search Bar", "Search Engine", searchbarengine);

  let newtabenabled = prefs.get("browser.newtabpage.enabled", true);
  this.record(EVENT_CODES.CUSTOMIZE, "newtab page", "Enabled?", newtabenabled);

  //for security team study, courtesy of Monica Chew
  let security_prefs = ["privacy.donottrackheader.enabled",
                      "browser.privatebrowsing.autostart","network.cookie.cookieBehavior",
                      "network.cookie.lifetimePolicy",
                      "places.history.enabled",
                      "browser.formfill.enable",
                      "privacy.sanitize.sanitizeOnShutdown",
                      "privacy.clearOnShutdown.cache",
                      "privacy.clearOnShutdown.cookies",
                      "privacy.clearOnShutdown.downloads",
                      "privacy.clearOnShutdown.formdata",
                      "privacy.clearOnShutdown.history",
                      "privacy.clearOnShutdown.offlineApps",
                      "privacy.clearOnShutdown.passwords",
                      "privacy.clearOnShutdown.sessions",
                      "privacy.clearOnShutdown.siteSettings",
                      "browser.urlbar.autocomplete.enabled",
                      "browser.urlbar.default.behavior",
                      "privacy.cpd.cache",
                      "privacy.cpd.cookies",
                      "privacy.cpd.downloads",
                      "privacy.cpd.formdata",
                      "privacy.cpd.history",
                      "privacy.cpd.offlineApps",
                      "privacy.cpd.passwords",
                      "privacy.cpd.sessions",
                      "privacy.cpd.siteSettings",
                      "xpinstall.whitelist.required",
                      "browser.safebrowsing.malware.enabled",
                      "browser.safebrowsing.enabled",
                      "signon.rememberSignons",
                      "security.ask_for_password",
                      "security.password_lifetime",
                      "security.enable_ssl3",
                      "security.enable_tls",
                      "security.default_personal_cert",
                      "security.remember_cert_checkbox_default_setting",
                      "security.OCSP.enabled",
                      "security.OCSP.require",
                      "browser.search.defaultenginename",
                      "browser.search.suggest.enabled",
                      "security.warn_viewing_mixed",
                      "security.warn_viewing_mixed.show_once",
                      "security.warn_entering_weak",
                      "security.warn_entering_weak.show_once"
                      ]

  for (let i = 0; i < security_prefs.length; i++) {
	  let pref_value = prefs.get(security_prefs[i], "");
	  this.record(EVENT_CODES.CUSTOMIZE, "Security Pref", security_prefs[i], pref_value);
  }

  // Count uses of search bar suggestions and awesomebar suggestions/autocompletion:
  this._obsSvc = Cc["@mozilla.org/observer-service;1"]
                      .getService(Ci.nsIObserverService);
  let self = this;
  this.autocompleteObserver = { observe: function(subject, topic, data) {
                         if (subject.getAttribute("class") == "searchbar-textbox") {
                           if (!(subject.valueIsTyped && subject.mEnterEvent) ) {
                             self.record(EVENT_CODES.ACTION, "searchbar", "",
                             "choose suggestion");
                           } else {
                             self.record(EVENT_CODES.ACTION, "searchbar", "",
                             "no suggestion");
                           }
                         }
                         if (subject.getAttribute("id") == "urlbar") {
                         if (!(subject.valueIsTyped && subject.mEnterEvent) ) {
                                 self.record(EVENT_CODES.ACTION, "urlbar", "",
                                 "choose suggestion");
                               } else {
                                 self.record(EVENT_CODES.ACTION, "urlbar", "",
                                 "no suggestion");
                               }
                         }
                                }};
  //See mxr.mozilla.org/mozilla-central/source/toolkit/components/autocomplete/nsAutoCompleteController.cpp#1253
  this._obsSvc.addObserver(this.autocompleteObserver, "autocomplete-will-enter-text", false);
  getPasswordManagerInfo();
};

*/