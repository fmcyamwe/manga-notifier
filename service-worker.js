// When you specify "type": "module" in the manifest background,
// you can include the service worker as an ES Module,as
//importScripts('./options/jobby'); //not supported
import { jobUrls } from './options/jobby.js';
import { DOMParser } from "https://code4fukui.github.io/xmldom-es/xmldom.js"; //>>this works!!
//"./xmldom";// node_modules/xmldom";
//'./libs/xmldom/index.js';
//'./libs/node_modules/@xmldom/xmldom';


var nIntervId = 0;
var currFreq = 1;
var running = 0;
//var notifId;
//var mangastream_base_url = "http://readms.net/"; 
//var mangafox_base_url = "http://mangafox.la";
var mangakakalot_url = "https://mangakakalot.com/";

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

//just for testing saving...is it key issue?!? >>yup it was!
/*chrome.storage.onChanged.addListener((changes, namespace) => { //bon no error with .local even
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${oldValue}", new value is "${newValue}".`
    );
  }
});
*/

function notify(message) {
  var data = message;
  
  //notifId = 
  chrome.notifications.create(data.url, {
    "type": data.type,
    "iconUrl": chrome.runtime.getURL("icons/manga-48.png"), //chrome.extension.getURL("icons/manga-48.png"),
    "title": data.title,
    "message": data.content
  });
  //console.log(data.title + "::" +data.url+ ","+ data.content); 
  //notifId.then((e) => {
  //  console.log("after creating", e); //just to see
  //});
}

function notifClicked(notifUrl) {
  var creating = chrome.tabs.create({
    url: notifUrl
  });
  console.log("clicked on notif:", notifUrl); //notifUrl == notifId
  //console.log(creating); 
  //creating.then((e) => {
  //  console.log("after clicking", e); //just to see
  //});
  chrome.notifications.clear(notifUrl); //clear notifId
}

function bgLoop(message) {
  console.log("in bgLoop with message==", message)
  if (message?.message =='ohHello'){
    //refresh();
    var getting = chrome.storage.local.get("data");
    getting.then(fetchManga,function (error) {
      console.log("Error retrieving from storage:",error);
    });
    //fetchManga()
    return //just to not trigger running...toReview why use that again?!?
  }

  if (running == 0) {
    // console.log("running bgLoop");
    running = 1;
    //refresh();
    runRefreshCheck()
    let interv = currFreq == 0 ? (0.5 * 3600 * 1000) : (currFreq * 3600 * 1000)
    nIntervId = setInterval(runRefreshCheck, interv); //currFreq * 3600 * 1000 // 5 * 60 * 1000
  } else{
     console.log("running = " + running + ". Not running bgLoop");
  }

}

async function getSavedChapter(title) {
  //console.log("getting::"+title)
  return await chrome.storage.local.get(title);
  /*try {
    let getting = await(chrome.storage.local.get(title));
    /*console.log("getSavedChapter"+title, getting); //prints? or have to .then here?!?
    getting.then((euh) => {
      console.log("getSavedThen", euh)
      return euh; //unhashed?!?
    })//*
    return getting; //unhashed?!?
  }catch (err){
    console.log("ERROR nothing of: "+title, err);
    return null
  }*/
}

async function saveChapter(title, hashedString) {
  var obj = {};
  obj[title] = hashedString;      
  //let e = 
  await(chrome.storage.local.set(obj));//.set({title: hashedString})); >>this was wrong!
}

/**
 * check if title in map of stored map if follow
 * if follow > hash to see if have seen latest chapter ( actually hash last three--in case missed some chapters)
 * when not seen > save chapter and make notification with chapter link!
 */
async function fetchManga(allMangas) {
  
  if (!allMangas.data.mangaTags){
    console.log("ERROR no mangas to check", allMangas)
    return 
  }

  var mangas = allMangas.data.mangaTags;
  let links = {};
  for(let i = 0; i < mangas.length; i++){
    let t = mangas[i].tag; //sheesh remove tag
    links[t] = true;
  }
  //console.log("all mangas:", links)

  try {
    const response = await fetch(mangakakalot_url)

    if (!response.ok) {
      throw new Error(`Errror querying kakalot! status:${response.status}`)
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
      //tagName on Elements 
      //data || nodeValue on Text 
      let arr = [] //in case of multiple nodes
      for (let i = 0; i < nodes.length; i++){
        if (nodes[i].tagName && nodes[i].tagName == tagName){
          arr.push(nodes[i])
          //return nodes[i]
        }
      }
      return arr
    }

    try {
      var chapters = doc.getElementsByClassName("itemupdate first"); //sts sts_1
      console.log("there be",chapters.length)
      
      for (let i = 0; i < chapters.length; i++) {
        let children = chapters[i].childNodes
        //console.log("da node be:"+i, chapters[i]);
        let ul = getTagElts(children, "ul")
        if (ul.length > 0){ //normally one ul 
          let li = getTagElts(ul[0].childNodes, "li") //should be title as first one
          let title = li[0].textContent.trim()
          //console.log("mangas:", title)
          if (title in links){
            console.log("WOOO found!!", title)
            //var allChapters = {};
            let allChapters = {}; //toSee if redeclaring gives prob...or move all this into another func?!? >>using let seems ok!
            for (let j = 1; j < li.length; j++){ //skip first one as it's title
              let span = getTagElts(li[j].childNodes, "span")
              if (span.length > 0) {
                //get chapter and link!
                let aT = span[0].childNodes[0].attributes  //a tag and should be only one
                let hr = aT.getNamedItem("href").value  //or nodeValue
                let chapTitle = aT.getNamedItem("title").value

                //console.log("span content: ", span[0].textContent.trim(),chapTitle, hr)

                allChapters[chapTitle] = hr ;
              }
            }

            //hash the last three as could be multi release and missed them
            var annon = []
            for (let code in allChapters) { // keep order? should keep added order--hopefully!
              //console.log(code +"::"+allChapters[code])
              annon.push(code +"::"+allChapters[code])
            }
            let hashy = [].join.call(annon,":~:") //can use other delimiter than default comma >>YES for borrowing a method!
            
            //var oldie = chrome.storage.local.get(title);
            getSavedChapter(title).then((svd) => {
              if (!(Object.keys(svd).length > 0 && Object.values(svd).length > 0)){
                saveChapter(title, hashy)
                
                console.log(`${title} had no local entry...saving chapters`, hashy);
                //then send notification for the last chapt
                //to get last key which is the earliest chapter.
                //let lkey = Object.keys(allChapters)[Object.keys(allChapters).length - 1]
                //console.log("with stats :",lkey, allChapters[lkey])
                var lkey = Object.keys(allChapters)[0]
                //console.log("bout to notify with stats :",title, lkey, allChapters[lkey])
                notify({
                  type: "basic",
                  title: title,
                  url: allChapters[lkey],
                  content: `New ${lkey} uploaded for ${title}`
                });
                
              }else {
                //console.log("oouh keys as",Object.keys(euh));
                //console.log("oouh values as",Object.values(euh));
                //for (let [key, value] of Object.entries(svd)) {
                //  console.log(`${key}:::${value}`);
                //}
    
                let saved = svd[title]
                if(saved) {
                  //console.log("oouh saved:", saved)
                  let c = saved.split(':~:')
                  console.log("current saved", c, c.length)
                  //let notiSent = false 
                  var seen = []
                  for(let i = 0; i < c.length; i++){
                    let aChap = c[i].split('::')
                    if (allChapters[aChap[0]]){ //so if chapt title in allChapters
                      seen.push(aChap[0])
                    }
                  }
                  //4,3,2 >>allChapters
                  //3,2,1 >>saved
                  //so seen should be one short....normally
                  let diff = Object.keys(allChapters).length - seen.length
                  if ((c.length - seen.length) > 0 && diff > 0){//should be the same..toTest
                    let lkey = Object.keys(allChapters)[Object.keys(allChapters).length - 1]
                    notify({
                      type: "basic",
                      title: title,
                      url: allChapters[lkey],
                      content: `New ${lkey} uploaded for ${title}`
                    });
                    saveChapter(title, hashy)
                  } else {
                    console.log(`**WARNING** for ${title} have seen`,seen, seen.length, Object.keys(allChapters).length) //when doing check but nothing new...
                  }
                } else {
                  console.log(`ERROR ${title} was empty?!?`) //shouldnt happen--toMonitor**
                  saveChapter(title, hashy)
                }
                
              }
            }).catch( error => {
              console.log("ERROR retrieving from local storage!!",error)
              throw new Error(`Errror from local storage:${error}`) //just throw this as def serious!
            })
          }
        } else {
          console.log("Not enough chapters...skipping!", ul.textContent.trim())
        }
      }

    } catch (e){
      if(e instanceof TypeError){
        console.log("Error getting classElements");
        console.log(e);
      } else {
        console.log("Weird Error",e);
        throw new Error(`Weird error:${e}`) //just throw...hopefully caught below and notifies
        //console.log(e);
      }
    }

  }catch (err){
    console.log("ERROR in fetch...:(")
    console.log(err);
    //should def let me know if this happens!
    notify({
      type: "basic",
      title: "Extension error",
      url: '', //should go to extension?!? chrome://extensions/ **toTest
      content: `ERROR occured ${err}`
    });
  }
}

function runRefreshCheck() {
  console.log("Run check called.");
  var getting = chrome.storage.local.get("data");
  getting.then(function (res) {
    // console.log(res);
    // Check if freq is the same. Else clear and restart.
    if (res && res.data && res.data.frequency){

      if (res.data.frequency == currFreq) {
        //var links = res.data.mangaTags;
        //getContent(links, 0);
        //fetchContent(links, 0);
        fetchManga(res)
      } else {
        console.log("Freq changed."+res.data.frequency);
        currFreq = res.data.frequency;
        clearInterval(nIntervId); // clear currently running interval
        running = 0; // needed so that bgLoop restarts properly
        bgLoop({}); // call bgloop in order to restart the loop with new freq
      }

    }else{
      console.log("Run check...nothing in storage!!");
    }

  });
}

//browser.runtime.onMessage.addListener(bgLoop);
chrome.runtime.onMessage.addListener(bgLoop);
chrome.notifications.onClicked.addListener(notifClicked);

/*function refresh() { //replaced by runRefreshCheck--toRemove**
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
*/