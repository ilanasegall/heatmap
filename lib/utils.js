"use strict";

const sysevents = require("sdk/system/events");
const {getTabs, getTabId, getOwnerWindow} = require("sdk/tabs/utils");
const {getOuterId} = require("sdk/window/utils");
const {extend,merge} = require("sdk/util/object");

let override = exports.override = function() merge.apply(null, arguments)
let rawTabfromTab = function(tab) {
	if (!tab) return null;

	let rawTabs = getTabs();

	for (let rawTab of rawTabs) {
		if (getTabId(rawTab) === tab.id)
		return rawTab;
	}
	return null;
}

/**
* @param {action, desc} string action and object description
* @return jsonable-object event described by these parameters
*
* Note:  adds timestamp (ts) unless there is already an existing ts
*/
let eventOf = exports.eventOf = function(action, desc) {
	let evt = {};
	evt.ts = Date.now();
	evt["action"] = action;
	evt = override(evt, desc)
	return evt;
}

/**
* @param {tab} jetpack tab object
* @return id of the tab's parent window
*
*/
let winIdFromTab = exports.winIdFromTab = function(tab) {
	var rawTab = rawTabfromTab(tab);
	if (!rawTab) return null;
	var win = getOwnerWindow(rawTab);
	if (!win) return null;
	return getOuterId(win);
}

/**
* @param {obj} data event to emit
* emits to "micropilot-user-actions"
* @return obj
*/
let emit = exports.emit = function(obj) {
	var valid_obj = validateDataObj(obj);
	if (!valid_obj) return null;
	let s = JSON.stringify(valid_obj)
	sysevents.emit("micropilot-user-events",{subject:null,data:s});
	console.log("emit:",s);
	return valid_obj;
};

/**
* @param {obj} data event to emit
* ensures any field with tab id has a window id; other criteria? To update later
* @return object to emit; null if inconsistencies
*/
let validateDataObj = function(obj) {
	return obj;
}


/** click obj from evt
  */
let clickObj = exports.clickObj = function(evt){
	let obj = {
		ts: Date.now()
	}
	return obj;
}