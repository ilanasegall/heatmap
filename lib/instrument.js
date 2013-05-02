/*! This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**  Example of usage
  *
  */

"use strict";

const panel = require("sdk/panel");
const {defer, promised, resolve} = require("promise");
const Request = require("sdk/request").Request;
const self = require("sdk/self");
const simplePrefs = require("sdk/simple-prefs");
const {prefs} = require("sdk/simple-prefs");
const tabs = require("sdk/tabs");

const micropilot = require("micropilot");
const {microlog,GOODSTATUS} = require("micropilot");
const {storage} = require("simple-storage");


let _study;  // grumble, put this up in scope, so functions can see it

/* utils */
let jsondump = function(thing){
  console.log(JSON.stringify(thing,null,2));
}

// prefs to 'show all recording events'
prefs["micropilotlog"] = true;
prefs["sdk.console.logLevel"] = 0;

/**
  */
let study = exports.study = function(options){
  let {topics,duration,uploadurl,studyid,uploadinterval,demographics,pingurl} = options;
  if (! studyid) {
    throw Exception("studyid must be defined")
  }
  // mirror it to `_study`, for use by other functions
  _study = micropilot.Micropilot(studyid).watch(topics);
  _study.lifetime(duration).then(function(){
    _study.ezupload({
      uploadurl:uploadurl,
      killaddon:killaddon
    })
  })

  if (uploadinterval) {
    uploadrecur(_study,uploadinterval,uploadurl)
  }

  if (demographics) {
    if (! storage.hasdemographics) getdemographics(_study);
  }

  if (pingurl) {
    ping(pingurl);
  }
  return _study;  //
}

/** ping once, as GET with personid.
  *
  * promises a reponse
  */
let ping = exports.ping = function(url){
  // TODO (glind), decide GET / POST?  What data should be included?
  let { promise, resolve } = defer();
  if (! _study) {
    return resolve("");
  }
  let dump_response = function(response){
    return JSON.stringify({status: response.status, text: response.text})
  }
  let R = Request({
    url: url,
    content:  {"personid":  _study._config.personid},
    // should this be snoop()?
    onComplete: function(response) {
      if (! GOODSTATUS[response.status]) {  // try again in interval ms
        microlog("ping success:", dump_response(response));
        resolve(response);
      } else {
        microlog("ping failure:", dump_response(response))
        resolve(response);
      }
    }
  });
  R.get();
  return promise
}

/*
  // (micropilot-userdemographics)
  // (micropilot-data)
 */
simplePrefs.on("micropilot-userdemographics", function(){getdemographics()});
simplePrefs.on("micropilot-data", function(){showdata()});

var pageMod = require("sdk/page-mod");


let datapage = self.data.url("micropilot/data.html");

pageMod.PageMod({
  include: datapage,
  contentScript:
    'var getdata = function() self.port.emit("getdata",{});'+
    'getdata();'+
    'window.document.getElementById("getdata").addEventListener("click", function(){self.port.emit("getdata",{})},true);' +
    'self.port.on("newdata",function(d){window.document.getElementById("collecteddata").textContent = JSON.stringify(d,null,2)});',
  contentScriptWhen: 'ready',
  contentScriptOptions: {},
  onAttach: function(worker) {
    worker.port.on("getdata",function(){
      var revsort = function(a,b) a.eventstoreid < b.eventstoreid ;
      if (_study) _study.data().then(function(d){
        d.sort(revsort);
        worker.port.emit("newdata",d)
      })
    });
  }
});

let showdata = exports.showdata = function(){
  micropilot.microlog("showdata");
  tabs.open(self.data.url("micropilot/data.html"))
}

/**
  * NO USER CONFIGURABLE PARTS FOR NOW.
  *
  */
let getdemographics = exports.getdemographics = function() {
  micropilot.microlog("getdemographics");
  // TODO (glind) what if there is no study?
  if (_study === undefined) {
    return false // ?
  }

  // if we don't have it?
  let p = panel.Panel({
    contentURL: self.data.url("micropilot/demographics.html"),
    width: 300,
    height: 300
  });
  // not sure what signal this should actually be on.
  p.port.on('useremail',function(data){
    console.log("got email!")
    study.record({ts: Date.now(), "msg": "useremail", "data": data.email})
    p.destroy();
    storage.hasdemographics = true;
  })
  p.show();
  return true;
}

/** Fuse based recurrent upload
  */
let uploadrecur= function(study,interval,url){
  if (! storage.lastupload) storage.lastupload = Date.now(); // tied to addon
  micropilot.Fuse({start: storage.lastupload, duration:interval}).then(
    function(){
      micropilot.microlog("mircopilot-recur-upload: fuse wants to upload");
      storage.lastupload = Date.now();
      study.upload(url).then(function(response){
    micropilot.microlog("micropilot-upload-response", response.text);
      });
      uploadrecur(study,interval,url); // call it again.
    })
};


/** replaceOptions
  */
let replaceOptions = exports.replaceOptions = function(options, oldoptions) {
  // todo (glind), this could be simpler.
  ["duration","uploadinterval"].forEach(function(k){
    if (options[k] !== undefined)  oldoptions.k = (options.k * sec);
  })
  ["uploadurl","killaddon","studyid","topics","pingurl","demographics"].forEach(function(k){
    if (options[k] !== undefined)  oldoptions.k = options.k;
  })
  return oldoptions;
}

/**
  */
exports.onUnload = function(reason){
  // note: won't catch unintall, just disable, shutdown, etc.
  if (_study) {
    _study.record({ts:Date.now(),msg: "addon-unload", data:{"reason": reason} });
  }
}


exports.Fuse = micropilot.Fuse;

