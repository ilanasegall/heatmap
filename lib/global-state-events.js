"use strict";

const {Cc,Ci} = require("chrome");
const {PrefsTarget} = require("sdk/preferences/event-target.js")

const sysevents = require("sdk/system/events");

let {emit} = require("./utils");

const Instants = {};
const WatchThese = {};

const allprefs = PrefsTarget({ branchName: "" });

allprefs.on("",function(name){
  // let's take them all!
  if (/^datareporting\./.test(name) ||
      /^app.update.lastUpdateTime\./.test(name) ){
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
];

let interesting_prefs = [
  "browser.startup.homepage",
  // telemetry team
  "toolkit.telemetry.enabled",
  "toolkit.telemetry.prompted",
  "toolkit.telemetry.rejected",
  "keyword.URL",
  "keyword.enabled"
]


let social_api_prefs = [
  "social.activeProviders",
  "social.enabled",
  "social.provider.current",
  "social.sidebar.open",
  "social.toast-notifications.enabled"
]

security_prefs.forEach(function(k){Instants[k]=true})
interesting_prefs.forEach(function(k){Instants[k]=true})
social_api_prefs.forEach(function(k){Instants[k]=true})

let checkPrefs = function(names){
  let out = {};
  Array.forEach(names,function(k) {out[k] = allprefs.prefs[k]})
  return out
}

// this needs to be called after study init, or they won't be ready yet!
let initialState = function(){
  let p = checkPrefs(Object.keys(Instants));
  let OUT = {ts:Date.now(), group: "startup-shutdown", prefs:p}

  let w = require("sdk/window/utils").getMostRecentBrowserWindow();
  if (! w) {
    emit(OUT);
    return
  }

  OUT.screen = {height: w.screen.height, width: w.screen.width }

  // if there are any where this varies, STALWART ALARM
  let toolbox = w.document.getElementById("navigator-toolbox");
  OUT.tabsontop =  (toolbox.getAttribute("tabsontop") == "true")?"true":"false";

  // Is the main menu bar hidden? (for unified Firefox Menu Bar on Windows)
  let toolbarMenubar = w.document.getElementById("toolbar-menubar");
  let autohide = toolbarMenubar.getAttribute("autohide");
  OUT['menubar-hidden'] = (autohide == "true")?"true":"false";


  // How many bookmarks in bookmark toolbar? Is bookmark toolbar shown?
  let bkmks = w.document.getElementById("PlacesToolbarItems").childNodes;
  let bkmkToolbar = w.document.getElementById("personal-bookmarks");

  OUT['bookmarks'] = {n: bkmks.length, visible: !bkmkToolbar.parentNode.collapsed }


  // TODO Any change to toolbar buttons? (Copy code from toolbar study
  // and see if user has added/removed/reoredered)

  // Is Sync set up? What's the last time it synced?
  OUT["sync"] = {'lastsync': allprefs.prefs["services.sync.lastSync"] || 0,
    "configured": !!allprefs.prefs["services.sync.username"] }

  OUT["searchengine"] = w.document.getElementById("searchbar").currentEngine.name

  OUT["newtab"] = ~~allprefs.prefs["browser.newtabpage.enabled"]

  OUT["logins"] = cleanLogins(getLoginsTable());

  // yes this is gross that it's a bit deeper in
  // < Tyler> gregglind: ah ok, cool. Just fyi, we are working on getting an api built right into Firefox, https://bugzilla.mozilla.org/show_bug.cgi?id=732527
  require("./Troubleshoot").Troubleshoot.snapshot(function(d){
    OUT["snapshot"] = d;
    emit(OUT);
  })
};

/**
  * @return object {pwd:[sites*]}, site: {host:<>,hostname:<>}
  */
function getLoginsTable() {
  var loginManager = Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);
    var logins = loginManager.getAllLogins();
    var loginsTable = {};
    for (var login in logins) {
        var loginInfo = logins[login];
        if (!loginsTable[loginInfo.password])
            loginsTable[loginInfo.password] = [];
        var loginSite = {
            hostname: loginInfo.hostname
        };

        try {
             loginSite.host = url.URL(loginInfo.hostname).host;
        }
        catch (e) {
            // These might not all be valid URLs, e.g. chrome://...
            // So if the URL class throws an error, just use the hostname again.
            loginSite.host = loginInfo.hostname;
        }

        loginsTable[loginInfo.password].push(loginSite);
    }
    return loginsTable;
}

/** de-password login table
  *
  * @return list [cleaned+], cleaned -> {pwlength:int,n: count(logins), sites:[site*]}
  */
let cleanLogins = function(logins){
  let out = [];
  for (let L in logins){
    out.push({pwlength:L.length,n:logins[L].length,sites:logins[L]})
  };
  return out
}

/** get initial state!
  *
  */
initialState();
require("unload").when(function(){
  initialState();
})

