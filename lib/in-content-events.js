"use strict";
//ad clicks for google (known to be an undercount) PRIORITY 1
//potential hits on any of the 6 major search engines instead of using searchbar, etc (undercount)
//invalid drawable?

//track "interaction-level" proxies, such as clicks and scrolls and gestures
//	--> on click, window document, allow propagation, allow to bubble back up through stack
//window.document.addEventListener("click",function(){console.log("got one")},true)
//all javascript events: http://www.quirksmode.org/dom/events/index.html

const {eventOf, winIdFromTab, emit} =  require("./utils");
const tabs = require("sdk/tabs");
const {getTabs, getTabId, getOwnerWindow} = require("sdk/tabs/utils");
const {getOuterId,isWindowPrivate,isBrowser} = require("sdk/window/utils");
const {PageMod} = require("page-mod");
const data = require("self").data;

require("sdk/deprecated/window-utils").WindowTracker({
  	onTrack: function (window) {
  		let appcontent = window.document.getElementById("appcontent");
  		if (appcontent) {
	  		appcontent.addEventListener("DOMContentLoaded", function() {
				listen_for_errors(window.gBrowser.contentDocument);
			})
	  	}
	}
});

let listen_for_errors = function(document) {
	if (document.getElementById("errorPageContainer") != null) {
  		console.log("404 page"+document.getElementById("errorTitleText").innerHTML+"pageload");
	}
}

PageMod({
	//match-pattern doesn't have case insensitivity. I'm over it.
	include: "about:home",
	contentScriptFile: data.url("moz-about-home-events.js"),
	attachTo:["existing","top","frame"],
	onAttach: function(worker) {
		console.log("we are on about:home");
	    worker.port.on('search-form-submit', function(event_data) {
	    	console.log("the search term was: " + event_data.search_term);
		});
		worker.port.on('homepage-widget-click', function(event_data) {
	    	console.log("widget clicked: " + event_data.elem);
		});
	}
});

//example: http://www.mozilla.org/en-US/firefox/14.0.1/whatsnew/?oldversion=13.0.1

PageMod({
	include: /http:\/\/www.mozilla.org.*firefox.*whatsnew.*/,
	contentScriptFile: data.url("moz-whatsnew-events.js"),
	attachTo:["existing","top","frame"],
	onAttach: function(worker) {
		worker.port.on("whatsnew-elem-clicked", function(event_data) {
			console.log("whatsnew elem clicked: " + event_data.elem);
		});
	}
});

//newtab-events being janky; omit right now