/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var utils = require("utils");

var tabs = require("tabs");
const {getTabs, getTabId, getOwnerWindow} = require("sdk/tabs/utils");
const { getMostRecentBrowserWindow, getOuterId } = require("sdk/window/utils");

exports["test utils"] = function(assert) {
    assert.pass("Utils unit test running!");
};

exports["test eventOf"] = function(assert) {
    // test that we get a proper event from our function
    var desc = { 'windowid' : 12345, 'tabid' : 6789101112 },
        noaction = "no-ts-event";
    var notsevent = utils.eventOf(noaction, desc);
    // eventOf should have given us a ts and an action
    assert.ok(typeof notsevent.ts !== undefined);
    assert.equal(notsevent.action, noaction);

    // test that our event doesn't override the given ts
    // also check that we can't override our own action
    var now = Date.now(),
        tsdesc = desc,
        action = "ts-event";
    tsdesc.ts = now;
    tsdesc.action = "wrong-action";
    var tsevent = utils.eventOf(action, tsdesc);
    assert.equal(tsevent.ts, now);
    assert.equal(tsevent.action, action);
}

exports["test winIdFromTab"] = function(assert) {
    var wrappedTab = tabs.activeTab;
    var chromeWindow = getMostRecentBrowserWindow();
    var winId = utils.winIdFromTab(wrappedTab);
    assert.equal(winId, getOuterId(chromeWindow));
};

require("test").run(exports);
