var nIntervId = 0;
var currFreq = 1;
var running = 0;
var mangastream_base_url = "http://readms.net/";
var mangafox_base_url = "http://mangafox.la";

function notify(message) {
  var data = message;
  // console.log(data.type + "," + data.title + "," + data.content);
  var notif = chrome.notifications.create(data.url, {
    "type": data.type,
    "iconUrl": chrome.runtime.getURL("icons/manga-48.png"), //chrome.extension.getURL("icons/manga-48.png"),
    "title": data.title,
    "message": data.content
  });
}

function notifClicked(notifId) {
  var creating = chrome.tabs.create({
    url: notifId
  });
}

function bgLoop(message) {

  if (running == 0) {
    // console.log("running bgLoop");
    running = 1;
    refresh();
    nIntervId = setInterval(refresh, currFreq * 3600 * 1000); // 10 * 1 * 1000
  }
  // else{
  //   console.log("running = " + running + ". Not running bgLoop");
  // }

}

function refresh() {
  // console.log("refresh called.");
  var getting = chrome.storage.local.get("data");
  getting.then(function (res) {
    // console.log(res);
    // Check if freq is the same. Else clear and restart.

    if (res.data.frequency == currFreq) {
      var links = res.data.mangaTags;
      getContent(links, 0);
    } else {
      // console.log("Freq changed.");
      currFreq = res.data.frequency;
      clearInterval(nIntervId); // clear currently running interval
      running = 0; // needed so that bgLoop restarts properly
      bgLoop({}); // call bgloop in order to restart the loop with new freq
    }
  });
}

function getContent(links, ind) {
  var url = links[ind].tag;
  // console.log("getContent called with " + url);

  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    // console.log("status " + this.status);
    if (this.readyState == 4) {
      // console.log("text parsing begins. status " + this.status);
      var parser = new DOMParser();
      var doc = parser.parseFromString(this.responseText, "text/html");

      var latestTitle = "";
      var latestUrl = "";
      if (/mangafox/i.test(url)) {
        // Mangafox link. Parse accordingly

      try {
        var titles = doc.getElementsByClassName("tips");
        latestTitle = titles[0];
        latestUrl = mangafox_base_url + latestTitle.pathname;
      // console.log("URL: " + mangafox_base_url + latestTitle.pathname);
      } catch (e) {
        // error in parsing implies either malformed url
        // or wrong response due to bad internet

        latestTitle = void 0; // so that it doesn't trigger the notifications or check block

        if(e instanceof TypeError){
          console.log("TypeError: Please check if the url is valid. If the url is working, it could be an internet issue.");
          console.log("Error thrown with URL: " + url);
        } else {
          console.log(e);
        }
      }

      } else if (/mangastream/i.test(url) || /readms/i.test(url)) {
        // Mangastream url. Parse accordingly
        try {
          var rows = doc.getElementsByTagName('tr'); // Collection of rows
          var r0 = rows[1]; // Start with 1 because row[0] is the header of the table i.e. 'Chapter' and 'Released'
          // console.log(r0);
          var child0 = r0.children[0]; // First <td> in the <tr>, i.e. Name of Chapter
          // console.log(child0);
          // console.log("Chapter Name: " + child0.innerText); // Chapter Name
          latestTitle = child0;

          var link0 = child0.firstChild; // <a href>
          latestUrl = mangastream_base_url + link0.pathname;
          // console.log(link0);
          // console.log("Path: " + link0.pathname);
          // console.log("Link: " + mangastream_base_url + link0.pathname); // URL to chapter
        } catch (e) {
          latestTitle = void 0; // so that it doesn't trigger the notifications or check block

          if(e instanceof TypeError){
            console.log("TypeError: Please check if the url is valid. If the url is working, it could be an internet issue.");
            console.log("Error thrown with URL: " + url);
          } else {
            console.log(e);
          }
        }
      }

      if (latestTitle !== void 0) {
        // chapters exist. test if notif needed
        var lastSeen = chrome.storage.local.get(url);
        lastSeen.then(function (res) {
          if (res[url] !== void 0) {
            // value exists
            if (res[url] !== latestTitle.innerText) {
              //something new. Notify user.
              //innerText could be trimmed to remove chapter number
              notify({
                type: "basic",
                title: latestTitle.innerText,
                url: latestUrl,
                content: "New content uploaded."
              });
              // modify last seen chapter
              var obj = {};
              obj[url] = latestTitle.innerText;
              chrome.storage.local.set(obj);
            }
            // else {
            //   // No new chapters case. Can be used to test features while debugging. Should be commented out in release versions.
            //   // console.log("No new chapters for " + latestUrl);
            //   // to test the notifs
            //   notify({
            //     type: "basic",
            //     title: latestTitle.innerText,
            //     url: latestUrl,
            //     content: "No new content."
            //   });
            // }
          } else {
            // add value
            var obj = {};
            obj[url] = latestTitle.innerText;
            chrome.storage.local.set(obj);
          }
        });
      }
      if (links[ind + 1] !== void 0) {
        getContent(links, ind + 1);
      }
    }
  };
  xhr.open("GET", url, true);
  xhr.send();
}

//browser.runtime.onMessage.addListener(bgLoop);
chrome.runtime.onMessage.addListener(bgLoop);
chrome.notifications.onClicked.addListener(notifClicked);