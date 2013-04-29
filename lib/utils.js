"use strict";

const sysevents = require("sdk/system/events");
const {getTabs, getTabId, getOwnerWindow} = require("sdk/tabs/utils");
const {getOuterId} = require("sdk/window/utils");


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
* @return event described by these parameters
*
*/
let eventOf = exports.eventOf = function(action, desc) {
	let evt = {};
	evt["action"] = action;
	for (var d in desc) {
		evt[d]=desc[d];
	}
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
	sysevents.emit("micropilot-user-events",{subject:null,data:valid_obj})
	console.log("emit:",JSON.stringify(valid_obj));
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