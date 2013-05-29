"use strict";

const tabs = require("sdk/tabs");
const windows = require("sdk/windows").browserWindows;
const winUtils = require("sdk/deprecated/window-utils");
const {getTabs, getTabId, getOwnerWindow} = require("sdk/tabs/utils");
const {getOuterId,isWindowPrivate,isBrowser,getMostRecentBrowserWindow} = require("sdk/window/utils");

const {eventOf, winIdFromTab, emit, Track, browserOnly} =  require("./utils");

let isPrivate = function() false;

try {
  isPrivate = require("private-browsing").isPrivate;
} catch (err) {
  emit({group: 'runtime-message', ts: Date.now(), msg:  "no-pb-lib-support"})
}


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

/*
14:58 <@John-Galt> Just do event.target == event.target.top or whatever.
14:59  * John-Galt can't remember whether the target is document or window...
15:04 < gregglind> Thanks.  window.gBrowser.contentDocument == evt.target seems to work too.  Thanks!
15:06 <@John-Galt> Well, if you only care about the foreground tab. But in that case you should just use an onLocationChange listener.
15:06 -!- canuckistani [canuckista@moz-E02853F1.vc.shawcable.net] has quit [Input/output error]
15:18 <@John-Galt> Well, if it's the document, it wouldn't. You'd need let win = event.target.defaultView; win.top == win

*/


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
        window.document.addEventListener("pageshow",function(evt){
          // this could be talking about the 'wrong tab'.  Ignore this for now.
          let win = evt.target.defaultView;
          // window.gBrowser.contentDocument==evt.target, only works in front win
          if (win.top == win) {
            let e = eventOf("tab-pageshow", describeTab(require("tabs").activeTab));
            try {
              e.textzoom = window.gBrowser.markupDocumentViewer.textZoom;
              e.fullzoom = window.gBrowser.markupDocumentViewer.fullZoom;
            } catch (err) {}

            emit(e)
          }
        },true)
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
  /* when this lands in 1.14 we can use this
  tabs.on("pageshow", function(tab,persist) {
    let e = eventOf("tab-pageshow", describeTab(tab));
    e.persist = persist;
    emit(e)
  });
  */
}();



let describeWindow = function(window) {
  let OUT = {
    group: "windows",
    windowid: window.id,
    ntabs:  window.tabs.length,
  };
  if (isPrivate(window)) OUT.private = true;

  return OUT
}

let basicWindowEvents = function() {
  ['open','close','activate','deactive','private'].forEach(function(k){
    windows.on(k,function(window){
      emit(eventOf("window:"+k,describeWindow(window)))
    })
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