/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* KNOWN ISSUES:

OSX
* mac menus are weird, and you will miss the actual menu clicks as 'clicks',
  but get them as commands
* mac 'fullscreen' and topbar buttons show neither clicks nor commands
* mac scroll is very... bursty (lots of events)
* mac scroll bar... hard to tell "click at spot" from "drag and click"
* 'select' doesn't work on text, just input fields

WINDOWS
* mostly untested

*/


"use strict";

const {Track,browserOnly,emit,override,
      tabAndWindowIds,ancestors,aboutClick} = require("./utils");

const UNKNOWN = "__unknown__";


/*
  menus, commands, etc.

  FOR CLICK,
    - if (el.command)  # give up, wait for command

  FOR COMMAND
    - if (contextMenu.contains(evt.target)){
        context menu! click!
      }
    - if (el.tagName) -> KEY
      if (el.tagName) -> menus?


  COMMANDS:
    - key
    - click

*/

/** MOUSEUP, COMMAND
  * an 'interesting' user event *should* (ideal world!) only emit/record ONE.
  *
  * However, you will probably get a COMMAND and a CLICK.
  * (and some things - like menus on osx, just give a command)
  *
  * This is a like a `parser` for events.
  *
  */
Track(browserOnly(function(window){
  ["mouseup","command"].map(function(t){
    window.addEventListener(t,function(evt){
      if (t == "command") {
        console.log("command!")
      }
      let OUT = override({ts: Date.now()}, tabAndWindowIds(window));
      let id, tagName, cur_id , cur_tagname = UNKNOWN;
      if (evt.target) {
        id = evt.target.id;
        tagName = evt.target.tagName;
      }

      let updates =
        maybeScrollbar(window,evt) ||
        maybeToolbars(window,evt) ||
        maybeMenuClick(window,evt) ||
        maybeContextMenu(window,evt) ||
        maybeTabContextMenu(window,evt) ||
        maybeCommand(window,evt) ||
        /*
        maybeSearchChooser(window,evt)||
        maybeBookmarkMenu(window,evt) ||
        maybePanorama(window,evt) ||
        */
        maybeContent(window,evt) ||
        {group: UNKNOWN, action:t, target:evt.target.id || UNKNOWN};
      OUT = override(OUT,updates);

      emit(OUT);
      console.log("FINAL ANSWER", OUT.group)
    },true)
  })
}));

/** Interface for "maybe" functions:
  *
  * - @return a dict of 'updates' if the event matches, null otherwise
  * - take 'window,evt' as args
  * - all should filter on evt.type
  */

// http://mxr.mozilla.org/mozilla-central/source/browser/base/content/browser-context.inc
// http://mxr.mozilla.org/mozilla-central/source/browser/base/content/browser-menubar.inc

/**
  */
let maybeMenuClick = function(window,evt){
  if (evt.type != "mouseup") { return }
  let OUT = { group: "menu-click" }
  console.log("maybe menu click?")

  Array.map(["toolbar-menubar","main-menubar"],function(id){
    let MenuBar = window.document.getElementById(id);
    if (! MenuBar) return
    if (! MenuBar.contains(evt.target)) return;

    let node = evt.target;
    let menuItemName = node.id;
    if (!menuItemName) {
      menuItemName = "user-defined item";
    }
    let menuName = UNKNOWN;
    while(node) {
      if (node.id == id) {
         break;
      }
      if (node.tagName == "menu" && node.id) {
        menuName = node.id;
        break;
      }
      node = node.parentNode;
    }
    OUT.action = "click";
    OUT.menuname = menuName;
    OUT.menuitem = menuItemName;
    OUT.menubar = id;
    OUT = override(OUT,aboutClick(evt))
    return OUT;
  })
}



/**
  */
let maybeContextMenu = function(window,evt){
  if (evt.type != "mouseup") { return }
  let OUT = {group:"context-menu"};
  let contextMenu = window.document.getElementById("contentAreaContextMenu");
  if (! contextMenu.contains(evt.target)) return

  if (evt.target && evt.target.id) {
    OUT.action = evt.target.id;
    OUT.command = evt.target.command || UNKNOWN;
  } else {
    OUT.action = UNKNOWN;
  }
  OUT = override(OUT,aboutClick(evt))
  return OUT
};

/**
  */
let maybeScrollbar = function (window,evt) {
  let shouldreturn = false;
  if (evt.type != "mouseup") return

  let OUT = {group:"scrollbar"};
  if (evt.button == 0) {
    let parent = evt.originalTarget.parentNode;
    if (parent.tagName != "scrollbar") return

    if (parent.parentNode.tagName == "HTML") {
      let orientation = parent.getAttribute("orient");
      let widgetName = orientation + "-scrollbar";
      OUT.widget = widgetName;
      let part = evt.originalTarget.tagName;
      if (part == "xul:slider") {
        // TODO can't distinguish slider from track...
        OUT.part = "slider";
        OUT.action = "drag-or-click";
        shouldreturn = true;
      } else if (part == "xul:scrollbarbutton") {
        OUT.action = "click"
        OUT.part = "button";
        let type = evt.originalTarget.getAttribute("type");
        if (type == "increment") { // vs. "decrement"
          OUT.direction = "up"
          shouldreturn = true;
        } else if (type == "decrement") {
          OUT.direction = "down"
          shouldreturn = true
        } else {
          OUT.direction = UNKNOWN
          shouldreturn = true
        }
      }
    }
  }
  OUT = override(OUT,aboutClick(evt))
  if (shouldreturn) return OUT
};

/** loop over all toolbars, see if el is in them.
  *
  * Note: there might be lighter ways of doing this.
  */
let whichToolbarContains = function(window,el){
  let toolbars = window.document.querySelectorAll('toolbar');
  for (var i = 0; i < toolbars.length; ++i) {
    let t = toolbars[i];
    if (t.contains(el)){
      return t;
    }
  }
}

/**
  */
let maybeToolbars = function(window,evt){
  if (evt.type != "mouseup") return;
  /* LONGTERM TODO:
   * Problem with just listening for "mouseup" is that it triggers even
   * if you clicked a greyed-out button... we really want something more
   * like "button clicked". Try listening for "command"? */

  let OUT = {group:"toolbars"};
  let id;

  let isTabBarEvent = maybeTabBar(window,evt);
  if (isTabBarEvent) return isTabBarEvent;

  if (evt.target) {
    let tagName = evt.target.tagName;
    console.log("maybe toolbar?", tagName)
    if (tagName == "toolbar"){
      OUT = {group:"toolbars"};
      OUT.target = evt.target.id;  // the toolbar itself, outside an element. misclick?
      OUT.action = "click";
      OUT.toolbar = evt.target.id || UNKNOWN;
      OUT.group = "toolbar:"+OUT.toolbar
      OUT = override(OUT,aboutClick(evt))
      return OUT;
    }

    let tb = whichToolbarContains(window,evt.target);
    if (!tb) return

    // we handle toolbarbuttons elsewhere
    if (tagName == "toolbarbutton") {
      id = evt.target.id;
    }

    /* There are a lot of spacer elements in the toolbar
    * that we don't care about tracking individually: */
    if (tagName == "toolbarspacer" ||
       tagName == "toolbarspring" ||
       tagName == "toolbarseparator" ||
       tagName == "splitter" ||
       tagName == "hbox") {
      id = "spacer";
    } else {
      id = evt.target.id;
    }

    OUT.target = id;
    OUT.action = "click";
    OUT.toolbar = tb.id;
    OUT.group = "toolbar:"+OUT.toolbar
    OUT = override(OUT,aboutClick(evt))
    return OUT
  }
};

// https://developer.mozilla.org/en-US/docs/XUL/List_of_commands
/**
  */
let maybeCommand = function(window,evt){
  if (evt.type != "command") return false;
  let OUT = {group: "commands:general"};

  let src;
  let hasSourceEvent;
  if (evt.sourceEvent){
    src = evt.sourceEvent.target;  // menuitems etc.
    hasSourceEvent = true;
  } else {
    src = evt.target;
    hasSourceEvent = false;
  }

  if (src.tagName == "menuitem") {

    let menuItemId = src.id?src.id:src.command;
    let menuId = UNKNOWN;
    let node = src;
    while(node) {
      if (node.tagName == "menupopup") {
        menuId = node.id;
        break;
      }
      node = node.parentNode;
    }
    OUT.action=src.id;
    OUT.trigger = src.tagName;
    OUT.menu = menuId;
    OUT.menuitem = menuItemId
    OUT.hasSourceEvent = hasSourceEvent
    OUT.group = "commands:menu";
    return OUT;
  } else if (src.tagName == "key") {
    OUT.action=evt.target.id;
    OUT.trigger=src.tagName;
    OUT.command = src.command?src.command:src.id;
    OUT.hasSourceEvent = hasSourceEvent
    OUT.group = "commands:key"
    return OUT;
  } else {
    console.log("command other?")
    OUT.action=evt.target.id;
    OUT.trigger=src.tagName || UNKNOWN;
    OUT.command = src.command?src.command:src.id;
    OUT.hasSourceEvent = hasSourceEvent
    OUT.group = "commands:"+OUT.trigger
    return OUT
  }
};

/** right clicks in the tab context menu?
  */
let maybeTabContextMenu = function(window,evt){
  if (evt.type != "command") return;

  let tabContext = window.document.getElementById("tabContextMenu");
  let OUT = {group: "tab-context-menu"};
  if (! tabContext.contains(evt.target)) return; // not ours

  // TODO, the acted upon tab can be NOT THE FOCUSED TAB...
  if (evt.target && evt.target.id) {
    OUT.action = evt.target.id;
    if (evt.target.id == "context_pinTab" ||
       evt.target.id == "context_unpinTab") {
      // TODO signal tabs change, or dont
    }
    emit(OUT);
  }
}

/**
  */
let maybeTabBar = function(window,evt){
  let tabBar = window.document.getElementById("TabsToolbar");
  if (evt.type != "mouseup") return;
  if (!tabBar || !tabBar.contains(evt.target)) return;

  let OUT = {group:"tab-bar"};
  if (evt.button == 0) {
    let targ = evt.originalTarget;
    if (targ.id == "new-tab-button" ||
        targ.className == "tabs-newtab-button" ) {
      OUT.target = "new-tab-button"
      OUT.intent = "new-tab-button"
    } else if (targ.id == "alltabs-button") {
      OUT.intent = "drop down menu";
      OUT.target = "alltabs-button";
    } else {
      switch (targ.getAttribute("anonid")) {
        case "scrollbutton-up":
          OUT.intent = "tab left";
          OUT.target = "scroll-left"
          break;
        case "scrollbutton-down":
          OUT.intent = "tab right";
          OUT.target = "scroll-right"
          break;
        }
    }
    return override(OUT,aboutClick(evt));
  }

  // TODO, decide how fancy to get here!
  // Record mouse-up and mouse-down on tab scroll buttons separately
  // so that we can tell the difference between click vs click-and-hold
  /*
    this._listen(tabBar, "mousedown", function(evt) {
                   if (evt.button == 0) {
                     let anonid = evt.originalTarget.getAttribute("anonid");
                     if (anonid == "scrollbutton-up") {
                         record("tabbar", "left scroll button", "mousedown");
                     }
                     if (anonid == "scrollbutton-down") {
                         record("tabbar", "right scroll button", "mousedown");
                     }
                   }
                 }, false);
    // Record picking an item from the tab drop down menu
    this._listen(tabBar, "command", function(evt) {
                   if (evt.originalTarget.tagName == "menuitem") {
                     /* TODO this seems to get triggered when you edit
                      * something in about:config and click OK or cancel
                      * -- weird. */
    /*
                     record("tabbar", "drop down menu", "menu pick");
                   }
               }, false);
    */
}


/**
  */
let maybeContent = function (window,evt) {
  let ee = evt;

  let allowed = {mouseup:true, select:true};
  if (! allowed[evt.type]){ return }
  if (ancestors(evt.target)[0] == window.document) return;
  // in content won't have the window.document as ancestor

  // TODO, beef this up a bit :)
  let OUT = {group: "in-content"};
  OUT.action = evt.type;
  OUT = override(OUT,aboutClick(evt));
  OUT.location = window.gBrowser.contentDocument.location.href
  return OUT
}

/* Browser swipe events
 *
 * group: gestures
 * direction:  "left","right","up","down","clockwise","counterclockwise",UNKNOWN
 * action:  ["MozSwipeGesture","MozMagnifyGesture","MozRotateGesture"]
 *
 */
Track(browserOnly(function(window){
  var trackpad_swipes = ["MozSwipeGesture","MozMagnifyGesture","MozRotateGesture"];
  trackpad_swipes.forEach(
    function(etype,ii){
      let OUT = override({ts: Date.now()}, tabAndWindowIds(window));
      OUT.group = "gestures";
      let myetype = etype;
      window.addEventListener(etype,function(evt){
        var direction = "";
        var delta = "";
        if (etype == "MozSwipeGesture") {
          //SimpleGestureEvent constants defined here: https://developer.mozilla.org/En/NsIDOMSimpleGestureEvent
          switch(evt.direction) {
            case 4:
              direction = "left";
              break;
            case 8:
              direction = "right";
              break;
            case 1:
              direction = "up";
              break;
            case 2:
              direction = "down";
              break;
            default:
              direction = UNKNOWN
            }
          }
          else if (etype == "MozMagnifyGesture"){
            direction = ["in","out"][~~evt.delta > 0]
          }
        else {
          if (evt.direction == 1) {
            direction = "counterclockwise";
          } else {
            direction = "clockwise";
          }
        }
        OUT.direction = direction;
        OUT.action = etype;
        OUT.command = evt.command;
        emit(OUT) // myetype, direction
      },true);
    });
}))



let aboutScroll = function(window,evt){
  // DOESN'T WORK!
  let doc = window.gBrowser.contentDocument;
  return {scrollX: window.scrollX,
         scrollY: window.scrollY}
}

/** SCROLL events, handled seperately.
  * an 'interesting' user event should only emit ONE.
  *
  * This is a like a `parser` for events.
  *
  * NOTE:  trackpad scroll, etc. spit multiple scroll events.
  * NOTE:  scoll event on whole window doesn't have id or tagName,
  *   somewhat weirdly, and I can't figure out direction :(
  * NOTE:  because it is "bursty", this evt is best used as an indicator
  *   of activity, and needs some (TBD) smoothing.
  */
Track(browserOnly(function(window){
  ["scroll"].map(function(t){
    window.addEventListener(t,function(evt){
      let OUT = override({ts: Date.now()}, tabAndWindowIds(window));
      OUT.group = "scroll";
      //OUT.direction = evt.detail || UNKNOWN;
      //OUT = override(OUT,aboutScroll(window,evt))
      if (throttle(OUT.tabid + ":scroll",OUT.ts,5*1000)){
        emit(OUT);
      } else {
        console.log("!throttleed")
      }
    },true)
  })
}))

/* buttons in toolbars */

let buttonIds = ["back-button", "forward-button", "reload-button",
                 "stop-button", "home-button", "feed-button", "star-button",
                 "identity-popup-more-info-button",
                 "back-forward-dropmarker", "security-button",
                 "downloads-button", "print-button", "bookmarks-button",
                 "history-button", "new-window-button", "tabview-button",
                 "cut-button", "copy-button", "paste-button",
                 "fullscreen-button", "urlbar-go-button", "urlbar-reload-button",
                 "urlbar-stop-button"];



/* location bar - all domains */


/* urlbar listener */
/* url change, onlocationchange */

/* pin/unpin tab */

/* chrome button ids (toolbar items), including location, custom toolbars (is a place to get all) */

/* site id button */
/* search box */
/* search engine dropdown */

/* bookmark toolbar */
/* ffbutton windows */
/* url go button */
/* tab bar actions */
/* bookmark popup panel */


/*
Track(browserOnly(function(window){
  console.log("BUTTONS FOR THIS WINDOW")
  console.log(Array.apply(null,window.document.querySelectorAll("toolbarbutton")).map(function(t) t.id))
}))
*/


// weird events?  (INCOMPLETE!)
//https://developer.mozilla.org/en-US/docs/DOM/Mozilla_event_reference?redirectlocale=en-US&redirectslug=Mozilla_event_reference
// > Array.map(window.document.querySelectorAll("tr td:first-child a[href*=event]"),function(x) x.text)



Track(browserOnly(function(window){
  [//"abort",  "blocked", "close", "complete",
  // DOM EVENTS ARE TOO LOUD
  //"DOMAttributeNameChanged", "DOMAttrModified",
  //"DOMCharacterDataModified", "DOMElementNameChanged", "DOMNodeInserted",
  //"DOMNodeInsertedIntoDocument", "DOMNodeRemoved", "DOMNodeRemovedFromDocument",
  //"DOMSubtreeModified",
  //"load", "message","open",

  // indexedDb
  // "progress", "success", "upgradeneeded","versionchange",

  //"MozTouchDown", "MozTouchMove", "MozTouchUp",
  //"onerror", "onstatuschange", "close",
  // "MozSwipeGesture",
  //"MozMagnifyGestureStart", "MozMagnifyGestureUpdate", "MozMagnifyGesture",
  //"MozRotateGestureStart", "MozRotateGestureUpdate", "MozRotateGesture",
  //"MozTapGesture", "MozPressTapGesture", "MozEdgeUIGesture",
  // "MozAfterPaint",  // this one is super common
  "MozBeforeResize",

  // Dom events are common
  //"DOMPopupBlocked", "DOMWindowCreated", "DOMWindowClose",
  //"DOMTitleChanged", "DOMLinkAdded", "DOMLinkRemoved", "DOMMetaAdded", "DOMMetaRemoved",
  //"DOMWillOpenModalDialog", "DOMModalDialogClosed", "DOMAutoComplete", "DOMFrameContentLoaded",

  // AlertClose doesn't seem to happen very consistently
  "AlertActive", "AlertClose",
  "fullscreen", "sizemodechange", "MozEnteredDomFullscreen",
  // we don't care about session save, really
  //"SSWindowClosing", "SSTabClosing", "SSTabRestoring", "SSTabRestored", "SSWindowStateReady","SSWindowStateBusy",

  "tabviewsearchenabled", "tabviewsearchdisabled", "tabviewframeinitialized", "tabviewshown", "tabviewhidden",

  // reflected in tabs events
  // "TabOpen", "TabClose", "TabSelect", "TabShow", "TabHide", "TabPinned", "TabUnpinned",

  // devtools, should be a specialized study
  //"CssRuleViewRefreshed", "CssRuleViewChanged", "CssRuleViewCSSLinkClicked"
  ].forEach(function (k){
    window.addEventListener(k,function(evt){
      let OUT = {group:"weird-events",ts: Date.now(),type:k}
      override(OUT,tabAndWindowIds(window));
      switch (k){
        case "MozBeforeResize":
          OUT.inner = {h: window.innerHeight, w:window.innerWidth};
          OUT.outer = {h: window.outerHeight, w:window.outerWidth};
          break;
        case "sizemodechange":
          OUT.windowState = window.windowState;  // 1,2,3,4 not clear!
          break;
      }

      if (k == "MozBeforeResize"){
        if (throttle(OUT.tabid + ":MozBeforeResize",OUT.ts,5*1000)){
          emit(OUT);
        } else {
          console.log("!throttleed")
        }
      } else {
        emit(OUT)
      }
    },true)

  }
  )
}));

/** throttle events to no more than 1 per period
  */
let _throttle = {};
let throttle = function(stringHash,ts,period) {
  let when = _throttle[stringHash];
  if (when === undefined) {
    _throttle[stringHash] = ts;
    return true
  } else {
    if ((ts - when) < period){
      return false  // too soon!
    } else {
      _throttle[stringHash] = ts;
      return true
    }
  }
}
