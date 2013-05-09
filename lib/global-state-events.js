"use strict";

const {Cc,Ci} = require("chrome");
const {PrefsTarget} = require("sdk/preferences/event-target.js")

const sysevents = require("sdk/system/events");

let {emit} = require("utils");

const Instants = {};
const WatchThese = {};

const allprefs = PrefsTarget({ branchName: "" });

allprefs.on("",function(name){
	// let's take them all!
	if (/^datareporting\./.test(name)){
		return
	} else {
		emit({ts:Date.now(), group: "prefs-change", name: name, value: allprefs.prefs[name]})

	}
})

let security_prefs = [
	"privacy.donottrackheader.enabled",
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

let interesting_prefs = [
	"browser.startup.homepage",
	// telemetry team
	"toolkit.telemetry.enabled",
	"toolkit.telemetry.prompted",
	"toolkit.telemetry.rejected",
	"keyword.URL",
	"keyword.enabled"
]

security_prefs.forEach(function(k){Instants[k]=true})
interesting_prefs.forEach(function(k){Instants[k]=true})


let checkPrefs = function(names){
	let out = {};
	Array.forEach(names,function(k) {out[k] = allprefs.prefs[k]})
	return out
}

// this needs to be called after study init, or they won't be ready yet!
let emitPrefs = exports.emitPrefs = function(){
	let p = checkPrefs(Object.keys(Instants));
	let OUT = {ts:Date.now(), group: "prefs-snapshot", prefs:p}
	emit(OUT)
};


/*
let GlobalStateObserver = Class({

})
*/
/*


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

// startup
emitPrefs();

require("unload").when(function(){
		emitPrefs();
})
