// When you specify "type": "module" in the manifest background,
// you can include the service worker as an ES Module,as
//importScripts('./options/jobby'); //not supported
import { jobUrls } from './options/jobby.js';
import { DOMParser } from "https://code4fukui.github.io/xmldom-es/xmldom.js"; //>>this works!!
//"./xmldom";// node_modules/xmldom";
//'./libs/xmldom/index.js';
//'./libs/node_modules/@xmldom/xmldom';


// Add a listener to create the initial context menu items,
// context menu items only need to be created at runtime.onInstalled
chrome.runtime.onInstalled.addListener(async () => {
  for (const [name, url] of Object.entries(jobUrls)) {
    chrome.contextMenus.create({
      id: url, //should switch this out**TODO
      title: name,
      type: 'normal',
      contexts: ['selection']
    });
  }
});

// Open a new search tab when the user clicks a context menu
chrome.contextMenus.onClicked.addListener((item, tab) => {
  const tld = item.menuItemId; //hopefully...
  const url = new URL(`${tld}${item.selectionText}/`);//new URL(`https://google.${tld}/search`);
  //url.searchParams.set('q', item.selectionText);
  //console.log("da URL be:", url)
  chrome.tabs.create({ url: url.href, index: tab.index + 1 });
});

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
  console.log("in bgLoop with message==", message)
  if (message?.message =='ohHello'){
    //refresh();
    fetchManga()
    return //just to not trigger running...toReview why use that again?!?
  }

  if (running == 0) {
    // console.log("running bgLoop");
    running = 1;
    refresh();
    nIntervId = setInterval(refresh, 5 * 60 * 1000 ); //currFreq * 3600 * 1000 // 10 * 1 * 1000
  } else{
     console.log("running = " + running + ". Not running bgLoop");
  }

}

async function fetchManga() {
  try {
    //retrieve all chapters from storage!
    //put the titles in a map!

    const response = await fetch("https://mangakakalot.com/")

    if (!response.ok) {
      throw new Error(`Err! status:${response.status}`)
    }

    let anotherResult = await response.text();
    //console.log("fetchManga text be",anotherResult);
    
    let regexp = /~<(?!\/)/g; //so whatever is ~< but without the '/' afterwards...under the 'slide' class

    //let matchAll = anotherResult.match(regexp) //better to use match smh

    //umm not even needed it seems as can just continue...beware of potential future issues though(i.e:removing proper stuff)***
    let pageHtml = anotherResult.replace(regexp, "-" )
   
    var parser = new DOMParser();
    var doc = parser.parseFromString(pageHtml, "text/html"); //this.responseText

    const getTagElts = (nodes, tagName) => {
      let arr = [] //in case of multiple nodes
      for (let i = 0; i < nodes.length; i++){
        if (nodes[i].tagName && nodes[i].tagName == tagName){
          arr.push(nodes[i])
          //return nodes[i]
        }
      }
      return arr
    }

    const getTitle = (nodes, tagName) => {
      for (let i = 0; i < nodes.length; i++){
        if (nodes[i].tagName && nodes[i].tagName == tagName){
          return nodes[i]
        }
      }
    }

    try {
      var chapters = doc.getElementsByClassName("itemupdate first"); //sts sts_1
      console.log("there be",chapters.length)

      //let aFilter = chapters[0].childNodes.filter(c => c.nodeType == 1) //for Element...dont work smh

       //so check if title in map of stored map if follow
      // if follow > hash to see if have seen latest chapter 
      // when not seen > save chapter and make notification with chapter link!
      
      for (let i = 0; i < chapters.length; i++) {
        let children = chapters[i].childNodes
        console.log("da node be:"+i, chapters[i]);
        let ul = getTagElts(children, "ul")
        if (ul.length > 0){
          //should be only one
          let li = getTagElts(ul[0].childNodes, "li")
          let title = li[0].textContent.trim()
          
          for (let j = 1; j < li.length; j++){
            console.log("li content: ", li[j])
          }
          
          //so check if in map

        } else {
          console.log("Not enough chapters...skipping!", ul)
        }

        //for (let i = 0; i < children.length; i++) {
        //  console.log("childy as:"+i, children[i].tagName) //so no innerText or textContent smh
          //tagName on Elements 
          //data || nodeValue on Text 
          //==ul then go down smh
        //}

      }

    } catch (e){
      if(e instanceof TypeError){
        console.log("Error getting classElements");
        console.log(e);
      } else {
        console.log("Weird Error getting classElements");
        console.log(e);
      }
    }

  }catch (err){
    console.log("ERROR in fetch...:(")
    console.log(err);
  }
}

function refresh() {
  console.log("refresh called.");
  var getting = chrome.storage.local.get("data");
  
  getting.then(function (res) {
    // console.log(res);
    // Check if freq is the same. Else clear and restart.
    if (res && res.data && res.data.frequency){

      if (res.data.frequency == currFreq) {
        var links = res.data.mangaTags;
        //getContent(links, 0);
        
        fetchContent(links, 0);//...no await i guess? 
      } else {
        console.log("Freq changed.");
        currFreq = res.data.frequency;
        clearInterval(nIntervId); // clear currently running interval
        running = 0; // needed so that bgLoop restarts properly
        bgLoop({}); // call bgloop in order to restart the loop with new freq
      }

    }else{
      console.log("In Refresh...nothing in storage!!");
    }

  });
}

async function fetchContent(links, ind) {
  try{
    var url = links[ind].tag;
    console.log("URL: " + url);

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Err! status:${response.status}`)
    }

    //const anotherResult = await response.text(); //what about using response.text ?!?toTEST**
   
    let anotherResult = await response.text();
    console.log("text be",anotherResult);

    //regex out? >> ~< BUT not those with ~</ (or remove whatever is under the 'slide' class smh)

    var parser = new DOMParser();
    var doc = parser.parseFromString(anotherResult, "text/html"); //this.responseText

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
    } else if (/chapmanganato/i.test(url)){
      console.log("YEEEE fetchContent a chapmanganato from kakalot!" + url);
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
      await fetchContent(links, ind + 1); //recursion!! neat
    }

  } catch(err) {
    console.log("ERROR in fetch...:(")
    console.log(err);
  }
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
      } else if (/chapmanganato/i.test(url)){
        console.log("YEEEE a chapmanganato,...in here though?!?" + url);
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
        //getContent(links, ind + 1);
        fetchContent(links, ind + 1);
      }
    }
  };
  xhr.open("GET", url, true);
  xhr.send();
}

//browser.runtime.onMessage.addListener(bgLoop);
chrome.runtime.onMessage.addListener(bgLoop);
chrome.notifications.onClicked.addListener(notifClicked);