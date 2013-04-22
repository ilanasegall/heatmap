"use strict";

//open/activate
//chrome events; event handlers
//in content?

var newWinFun = {
  onTrack: function (window) {
    emit("Tracking a window: " + window.location, + ", " + window.id);
  },
  onUntrack: function (window) {
    emit("Untracking a window: " + window.location);
  }
};

var tabs = require("sdk/tabs");

tabs.on('open', function onOpen(tab) {
	emit("Tab opened: " + tab.id)
});

//note actions that are being pushed directly

//let emit = function(dict){
//stub implementation of emit, which will also attach timestamp, etc
let emit = function(string) {
	console.log(string)
}

let chromeEvents = function(){

}

let windowEventTracker = function(){
	var winUtils = require("window-utils");
	var tracker = new winUtils.WindowTracker(newWinFun);  
}

let tabEventTracker = function(){
    windowEventTracker();

    
}();


//pump out onto a channel and recording into instrument options
//require unload; remove contextMenuTracker etc