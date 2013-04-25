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

let basicTabEvents = function(){
	tabs.on('open', function onOpen(tab) {
		emit({
			"tab_id": tab.id,
			"window_id": winIdFromTab(tab)
		});
	});
	/*tabs.on('ready', function onReady(tab) {
		emit("Tab loaded: " + tab.id);
	});
	tabs.on('activate', function onActivate(tab) {
		emit("Tab activated: " + tab.id);
	});
	tabs.on('deactivate', function onDeactivate(tab) {
		emit("Tab deactivated: " + tab.id);
	});
	tabs.on('close', function onClose(tab) {
		emit("Tab closed: " + tab.id);
	});*/
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