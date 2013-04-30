/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { getOuterId, isBrowser } = require("window/utils");
const {WindowTracker} = require("sdk/deprecated/window-utils");

const {emit,eventOf,override} = require("utils");

let Track = function(fn) WindowTracker({ onTrack: fn});
let browserOnly = function(fn) {
	return function(window) {
		if (!isBrowser(window)) return
		fn(window)
	}
}

let tabAndWindow = function(window){
	return {tabid: "FAKE", windowid: "FAKE"}
}

/* tab context area */

/* toolbar clicks */

/* scrollbars */
/* this needs beefing up to handle click vs. drag in osx #13 */
/*
12:46 <@dolske> gregglind: yes, it's special.
12:47 -!- mihok [mihok@moz-4E634B21.cpe.net.cable.rogers.com] has quit [Connection reset by peer]
12:47 <@dolske> The OS X menu bar is a native toolbar, and there is magic to map the XUL bits to the Cocoa bits.
12:48 -!- mihok [mihok@moz-4E634B21.cpe.net.cable.rogers.com] has joined #introduction
12:48 <@dolske> most things should just work, though.
12:48 -!- sayan [sayanchowd@85501575.F058680.EACE93BE.IP] has quit [Ping timeout]
12:48 <@dolske> (but you'll fail if you try to, say, jam arbitraty content into the XUL menu, because the menus you see are not XUL)
12:49 < gregglind> dolske, what's it called?  is is part of the 'window' via id?
12:50 <@dolske> https://mxr.mozilla.org/mozilla-central/source/widget/cocoa/nsMenuBarX.mm
12:50 < gregglind> window.document.getElementById("toolbar-menubar").addEventHandler("click" // or command //...  doesn't seem to work right
	*/
Track(browserOnly(function(window){
  let content = window.document.getElementById("content");
  content.addEventListener("mouseup", function(evt) {
	let shouldemit = false;
	let OUT = {ts: Date.now(), group:"scrollbar"};
    if (evt.button == 0) {
      let parent = evt.originalTarget.parentNode;
      if (parent.tagName == "scrollbar") {
        if (parent.parentNode.tagName == "HTML") {
					let orientation = parent.getAttribute("orient");
					let widgetName = orientation + "-scrollbar";
					OUT.widget = widgetName;
					let part = evt.originalTarget.tagName;
					if (part == "xul:slider") {
						// TODO can't distinguish slider from track...
						OUT.part = "slider";
						OUT.action = "drag"
						shouldemit = true;
						let type = evt.originalTarget.getAttribute("type");
						console.log(type)
		} else if (part == "xul:scrollbarbutton") {
		  OUT.action = "click"
		  OUT.part = "button";
						let type = evt.originalTarget.getAttribute("type");
						if (type == "increment") { // vs. "decrement"
							OUT.direction = "up"
							shouldemit = true;
						} else if (type == "decrement") {
							OUT.direction = "down"
							shouldemit = true
						} else {
							OUT.direction = "unknown"
							shouldemit = true
		}
          }
        }
      }
    }
    shouldemit && emit(override(OUT,tabAndWindow()));
  }, false);
}))


/* menu items */
Track(browserOnly(function(window){
	// two menubars!  see issue #14
	["toolbar-menubar","main-menubar"].forEach(function(id){
	  let MenuBar = window.document.getElementById(id);
	  console.log("set listener for", id)
	  MenuBar.addEventListener("click", function(evt) {
		console.log("GOT SOMETHING!")
		let OUT = {ts: Date.now()};
	    let node = evt.target;
	    let menuItemName = node.id;
	    if (!menuItemName) {
	      menuItemName = "user-defined item";
	    }
	    let menuName = "unknown";
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
	    OUT.group = "mainmenu";
	    OUT.menuname = menuName;
	    OUT.menuitem = menuItemName;
	    emit(override(tabAndWindow(), OUT));
	  }, true);
	})
}));

/* commands, including some menu driven ones */
// re #14, this catches menu commands on osx
Track(browserOnly(function(window){
	let mainCommandSet = window.document.getElementById("mainCommandSet");
  mainCommandSet.addEventListener("command", function(evt) {
	let OUT = {ts:Date.now(), group: "command"};
	OUT = override(OUT,tabAndWindow());
    let tag = evt.sourceEvent.target;
    if (tag.tagName == "menuitem") {
      let menuItemId = tag.id?tag.id:tag.command;
      let menuId = "unknown";
      let node = evt.sourceEvent.target;
      while(node) {
        if (node.tagName == "menupopup") {
          menuId = node.id;
          break;
        }
        node = node.parentNode;
      }
      OUT.action=evt.target.id;
      OUT.trigger='mouse';
      OUT.menu = menuId;
      OUT.menuitem = menuItemId;

      emit(OUT);
      record(menuId, menuItemId, "mouse");
    } else if (tag.tagName == "key") {
      OUT.action=evt.target.id;
      OUT.trigger='keyboard';
      OUT.command = tag.command?tag.command:tag.id;
      emit(OUT);
    }},
    true);
}));

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


/* tab bar context menu */
Track(browserOnly(function(window){
	let tabContext = window.document.getElementById("tabContextMenu");
	tabContext.addEventListener("command", function(evt) {
		if (evt.target && evt.target.id) {
			record("tab context menu", evt.target.id, "click");
			if (evt.target.id == "context_pinTab" ||
			   evt.target.id == "context_unpinTab") {
			   /* When you pin or unpin an app tab, record
			    * number of pinned tabs (number recorded is number
			    * BEFORE the change)*/
			   let change = 1;
			   if (evt.target.id != "context_pinTab" ) change = -1;
			   let numAppTabs = window.gBrowser._numPinnedTabs;
			   exports.handlers.record(EVENT_CODES.CUSTOMIZE,
			                           "Tab Bar", "Num App Tabs",
			                           numAppTabs + change);
				}
			}
		}, true);
}))
