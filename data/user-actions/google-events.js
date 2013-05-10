/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


$(function(){

	var relatedto = $("#tvcap h2 b").text();

	//$("#mbEnd, #tads").css("border","solid red 2px");

	$("#mbEnd, #tads").find("a").on("click",function(e) {
	  console.log("got one!");
	  var OUT = {ts: Date.now(),group:"google-sem-ad-clicked"};
	  var A = $(e.target).closest('a');
	  var boxid = A.closest("#mbEnd, #tads").attr("id");
	  OUT.text = A.text();
	  OUT.target = A.attr("href");
	  OUT.relatedto = relatedto;
	  OUT.id = A.attr("id");
	  OUT.terms = A.find("b").map(function() {return jQuery.text(this)} ).get();
	  OUT.allterms = $(e.target).closest("ol").find("b").map(function() {return jQuery.text(this)} ).get();
	  OUT.boxid = A.closest("#mbEnd, #tads").attr("id");
	  OUT.which = ["top","side"][~~(boxid=="mbEnd")];
	  //console.log("google-sem-ad-clicked",OUT);
	  self.port.emit("google-sem-ad-clicked",OUT)
		//return false;
	});

})
