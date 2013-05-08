"use strict";

let side_ads = $("#mbEnd").find("a"); 

var top_ad_ids = $("#tads").find("a");

top_ad_ids.each(function(ind, val) {
	console.log(ind);
	console.log($(val).attr("id"));
})


document.body.onclick = function(e) {

	console.log($(e.target).closest('a').attr("id"));

//	console.log("desc of ad? " + $(e.target).parents("#tads").length > 0);
//	console.log("desc of ad? " + $(e.target).parents($("#mbEnd")).length > 0);

	//console.log("target id: "+e.target.id);
	//console.log("closest a target id: "+ Object.keys(e.target.closest("a")));
		//self.port.emit("search-form-submit", {search_term:document.getElementById("searchText").value, ts: ts.Date.now()});

};