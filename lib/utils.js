"use strict";

//window_id, tab_id
//let emit = function(dict){
//stub implementation of emit, which will also attach timestamp, etc

//json stringify
let emit = exports.emit = function(obj) {
	console.log(JSON.stringify(obj));
}