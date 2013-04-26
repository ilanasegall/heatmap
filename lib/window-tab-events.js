"use strict";

const {winIdFromTab, emit} =  require("./utils");
const tabs = require("sdk/tabs");
const {getTabs, getTabId, getOwnerWindow} = require("sdk/tabs/utils");
const {getOuterId,isWindowPrivate,isBrowser} = require("sdk/window/utils");

//ILANA: update w/ current win model
var newWinFun = {
  onTrack: function (window) {
  	if (!isBrowser(window)) return;
  		emit({
  			"group": "window",
  			"action": "track",
  			"window_id": getOuterId(window) 
  		});
  },
  onUntrack: function (window) {
    emit("Untracking a window: " + window.location);
  }
};

//tab drag??
//tab reorder??
//listen for pinning, mark as reload?

let basicTabEvents = function(){
	tabs.on('open', function onOpen(tab) {
		emit({
			"group": "tabs",
			"tab_id": tab.id,
			"window_id": winIdFromTab(tab),
			"action": "tab-open",
			"pinned": tab.isPinned,
			"url": tab.url
		});
	});
	tabs.on('ready', function onReady(tab) {
		emit({
			"group": "tabs",
			"tab_id": tab.id,
			"window_id": winIdFromTab(tab),
			"action": "tab-ready",
			"pinned": tab.isPinned,
			"url": tab.url
		});
	});
	tabs.on('activate', function onActivate(tab) {
		emit({
			"group": "tabs",
			"tab_id": tab.id,
			"window_id": winIdFromTab(tab),
			"action": "tab-activate",
			"pinned": tab.isPinned,
			"url": tab.url
		});
	});
	tabs.on('deactivate', function onDeactivate(tab) {
		emit({
			"group": "tabs",
			"tab_id": tab.id,
			"window_id": winIdFromTab(tab),
			"action": "tab-deactivate",
			"pinned": tab.isPinned,
			"url": tab.url
		});
	});
	tabs.on('close', function onClose(tab) {
		emit({
			"group": "tabs",
			"tab_id": tab.id,
			"window_id": winIdFromTab(tab),
			"action": "tab-close",
			"pinned": tab.isPinned,
			"url": tab.url
		});
	});
}();


//Should we track reload as a reload button press followed by a load?
//record lifespan at death?

//note actions that are being pushed directly

let windowEventTracker = function(){
	var winUtils = require("window-utils");
	var tracker = new winUtils.WindowTracker(newWinFun);  
}();

let tabEventTracker = function(){


}();


//pump out onto a channel and recording into instrument options
//require unload; remove contextMenuTracker etc