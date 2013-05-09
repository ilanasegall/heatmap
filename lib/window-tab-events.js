"use strict";

const tabs = require("sdk/tabs");
const windows = require("sdk/windows").browserWindows;
const winUtils = require("sdk/deprecated/window-utils");
const {getTabs, getTabId, getOwnerWindow} = require("sdk/tabs/utils");
const {getOuterId,isWindowPrivate,isBrowser,getMostRecentBrowserWindow} = require("sdk/window/utils");

const {eventOf, winIdFromTab, emit, Track, browserOnly} =  require("./utils");

let toolbarsForWindow = function(window){
  let toolbars = {}
  Array.forEach(window.document.getElementsByTagName('toolbar'), function(t){
    toolbars[t.id] = !(t.hidden || t.autohide || t.collapsed)
  })
  return toolbars
}

//onfocus??
//on minimize?
//check for tabless windows


var newWinFun = {
    onTrack:
      function (window) {
        if (!isBrowser(window)) return;
        emit({
          group:"window",
          action:"tracking",
          isPrivate:isWindowPrivate(window),
          windowid: getOuterId(window),
          ts: Date.now(),
          //tabcount: window.gBrowser.tabs.length,
          toolbars: toolbarsForWindow(window)
        });
    },
  onUntrack:
    function (window) {
      if (!isBrowser(window)) return;
      emit({
        group:"window",
        action:"untracking",
        windowid: getOuterId(window),
        ts: Date.now(),
        toolbars: toolbarsForWindow(window)
      });
    }
}


//tab drag??
//tab reorder??
//listen for pinning, mark as reload?


//obj description = describeTab(tab) -> return {isPinned:, etc..)
//let d = describeTab(tab);  d.ts = date.now(), d.action  emit(d)
//eventOf ts, group, action
//emit(eventOf("open",describeTab(tab)))

//record privacy of tab?

let describeTab = function(tab) {
  return {
    group: "tabs",
    windowid: winIdFromTab(tab),
    // tab properties
    tabid:   tab.id,
    index:  tab.index,
    pinned: tab.isPinned,
    title: tab.title,
    url: tab.url
  }
}

let basicTabEvents = function() {
  tabs.on("open", function(tab) {
    emit(eventOf("tab-open", describeTab(tab)));
  });
  tabs.on("ready", function(tab) {
    emit(eventOf("tab-ready", describeTab(tab)));
  });
  tabs.on("activate", function(tab) {
    emit(eventOf("tab-activate", describeTab(tab)));
  });
  tabs.on("deactivate", function(tab) {
    emit(eventOf("tab-deactivate", describeTab(tab)));
  });
  tabs.on("close", function(tab) {
    emit(eventOf("tab-close", describeTab(tab)));
  });
}();


//Should we track reload as a reload button press followed by a load?
//record lifespan at death?

//note actions that are being pushed directly

let windowEventTracker = function(){
  var tracker = new winUtils.WindowTracker(newWinFun);
}();


// toolbar customization events: actual customization!
// show/hide isn't reflected here.
// https://developer.mozilla.org/en-US/docs/XUL/Toolbars/Toolbar_customization_events
Track(browserOnly(function(window){
  ["aftercustomization"].forEach(function(k){
    window.addEventListener(k,function(evt){
      let OUT={group:"toolbar-customize",ts:Date.now()}
      OUT.toolbars = toolbarsForWindow(window);
      emit(OUT)
    })
  })
}))