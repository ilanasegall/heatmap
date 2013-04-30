/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

/** pulse events for in-content-clicks, etc.
  *
  */

const { getOuterId, isBrowser } = require("window/utils");

const { emit, eventOf } = require("utils");

require("sdk/deprecated/window-utils").WindowTracker({
	onTrack: function(window){
		if (!isBrowser(window)) return
		["click"].forEach(function(t){
			window.document.getElementById("appcontent").addEventListener(t,function(){
				let desc = {
					action: t,
					location: window.gBrowser.contentDocument.location.href, //window.location.href,
					windowid:  getOuterId(window),
					ts: Date.now(),
					group:"app-content"
				};
				utils.emit(
					eventOf(t,desc)
				)
			})
		})
	}
});


//ad clicks for google (known to be an undercount) PRIORITY 1
//about:home, landing, searches, widgets
//what's new page
//newtab
//potential hits on any of the 6 major search engines instead of using searchbar, etc (undercount)

//track "interaction-level" proxies, such as clicks and scrolls and gestures
//	--> on click, window document, allow propagation, allow to bubble back up through stack
//window.document.addEventListener("click",function(){console.log("got one")},true)
//all javascript events: http://www.quirksmode.org/dom/events/index.html