"use strict";

let searchForm = document.getElementById("searchForm");

searchForm.addEventListener("submit", function() {
	//click vs enter?
	self.port.emit("search-form-submit", {search_term:document.getElementById("searchText").value, ts: Date.now()});
}, true);

let widget_ids = ["downloads", "bookmarks", "history", "addons", "sync", "settings"];

for(let i = 0; i < widget_ids.length; i++) {
let id = widget_ids[i];
let widget = document.getElementById(id);
widget.addEventListener("mouseup", function() {
 	self.port.emit("homepage-widget-click", {elem:id, ts: Date.now()});
	}, true);
}