/*! This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

"use strict";

/* instrument constants */
const sec = 1000;
const days = 86400 * sec;
const instrument = require("instrument");
let {storage} = require("simple-storage");
let study; // useful to have it in main scope
let {instrumentOptions} = require("instrument-options");

let main = exports.main = function(options,callbacks){
  //https://addons.mozilla.org/en-US/developers/docs/sdk/latest/dev-guide/tutorials/load-and-unload.html
	let reason = options.loadReason;

	if (! storage.firststartup) { storage.firststartup = Date.now()} // useful for calendar timers

	/* cfx run --static-args '{instrumentOptions:{}}' overrides */
	let newInstrumentOptions = options.staticArgs.instrumentOptions;
	if (newInstrumentOptions !== undefined) {
		instrumentOptions = instrument.updateOptions(options.staticArgs.instrumentOptions, newInstrumentOptions);
  }

  // prefs, upload timers, `watched` topics etc, are all baked in.
	study = instrument.study(instrumentOptions);
	// example bare `record`, wise to record startup.
	study.record({ts:Date.now(),msg: "addon-main", data:{"reason": reason} });

  /* OTHER THINGS YOU CAN DO
    instrument.ping(instrumentOptions.pingurl);
	  if (! storage.hasdemographics) instrument.getdemographics(study);
	  instrument.Fuse({start: storage.firststartup, duration: 2*days}).then(function(){
			modify_ui();
			ask_your_survey();
			start_a_study();
	  })
	*/
  instrument.showdata();

	/* add your normal main code here */

}

exports.onUnload = function(reason){
	// note: won't catch unintall, just disable, shutdown, etc.
	if (study) study.record({ts:Date.now(),msg: "addon-unload", data:{"reason": reason} });
}