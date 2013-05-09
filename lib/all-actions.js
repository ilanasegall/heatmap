/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

require("./chrome-events");
require("./global-state-events");
require("./in-content-events");
require("./window-tab-events");

/** listen for this topic, to get everything!
  */
let TOPIC = exports.TOPIC = require("./utils").TOPIC;