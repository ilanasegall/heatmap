"use strict";
let elem_ids = ["download-button-mobile-release", "video-player", "tabzilla", "colophon"];
for (let i = 0; i < elem_ids.length; i++){
	let elem = document.getElementById(elem_ids[i]);
	elem.addEventListener("mouseup", function() {
		self.port.emit("whatsnew-elem-clicked",{elem: elem.id, ts: ts.Date.now()});
	}, true);
}