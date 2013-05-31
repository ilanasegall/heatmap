/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

/** pulse events for in-content-clicks, etc.
  *
  */


const {eventOf, winIdFromTab, emit} =  require("./utils");
const tabs = require("sdk/tabs");
const {getTabs, getTabId, getOwnerWindow} = require("sdk/tabs/utils");
const {getOuterId,isWindowPrivate,isBrowser} = require("sdk/window/utils");
const {PageMod} = require("page-mod");
const data = require("self").data;

/* NOTE: general in-content clicks are acutally handled just fine in chrome-events */


//ad clicks for google (known to be an undercount) PRIORITY 1
//potential hits on any of the 6 major search engines instead of using searchbar, etc (undercount)
//invalid drawable?

//track "interaction-level" proxies, such as clicks and scrolls and gestures
//  --> on click, window document, allow propagation, allow to bubble back up through stack
//window.document.addEventListener("click",function(){console.log("got one")},true)
//all javascript events: http://www.quirksmode.org/dom/events/index.html


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
    OUT = {ts:Date.now(),group:"badpage"};
    emit(OUT);
    console.log("404 page"+document.getElementById("errorTitleText").innerHTML+"pageload");
  }
}

//not stricly necessary to have this script when there are content trackers in chrome-events,
//but this content script kept in to demonstrate how we will extract info from specific
//pages in std heatmap
PageMod({
  include: "about:home",
  contentScriptFile: data.url("user-actions/moz-about-home-events.js"),
  attachTo:["existing","top","frame"],
  onAttach: function(worker) {
    let tid = tabs.activeTab.id;
    let wid = winIdFromTab(tabs.activeTab); 
    worker.port.on('search-form-submit', function(event_data) {
      emit({
        group: "about:home_events",
        action: "search_submit",
        search_term: event_data.search_term,
        target: "searchText",
        ts: event_data.ts,
        tabid: tid,
        windowid: wid
      });
    });
    worker.port.on('homepage-widget-click', function(event_data) {
      emit({
        group: "about:home_events",
        action: "widget_clicked",
        target: event_data.elem,
        ts: event_data.ts,
        tabid: tid,
        windowid: wid
      });
    });
  }
});


PageMod({
  include: [/.*google.*/],
  contentScriptFile: [data.url("user-actions/jquery.js"),data.url("user-actions/google-events.js")],
  attachTo:["existing","top","frame"],
  contentScriptWhen: "ready",
  onAttach: function(worker) {
      worker.port.on("google-sem-ad-clicked", function(event_data) {
        emit(event_data);
    });
  }
});
