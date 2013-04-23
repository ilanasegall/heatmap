"use strict";
//ad clicks for google (known to be an undercount) PRIORITY 1
//about:home, landing, searches, widgets
//what's new page
//newtab
//potential hits on any of the 6 major search engines instead of using searchbar, etc (undercount)

//track "interaction-level" proxies, such as clicks and scrolls and gestures
//	--> on click, window document, allow propagation, allow to bubble back up through stack
//window.document.addEventListener("click",function(){console.log("got one")},true)
//all javascript events: http://www.quirksmode.org/dom/events/index.html