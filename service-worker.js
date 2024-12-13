// When you specify "type": "module" in the manifest background,
// you can include the service worker as an ES Module,as
//importScripts('./options/jobby'); //not supported
//import { jobUrls } from './options/jobby.js';
import { DOMParser } from "https://code4fukui.github.io/xmldom-es/xmldom.js"; //>>this works!!
//"./xmldom";// node_modules/xmldom";
//'./libs/xmldom/index.js';
//'./libs/node_modules/@xmldom/xmldom';


var nIntervId = 0;
var currFreq = 1;
var running = 0;
var mangakakalot_url = "https://mangakakalot.com/";

// Add a listener to create the initial context menu items,
// context menu items only need to be created at runtime.onInstalled
/*chrome.runtime.onInstalled.addListener(async () => {
  for (const [name, url] of Object.entries(jobUrls)) {
    chrome.contextMenus.create({
      id: url, //should switch this out**TODO
      title: name,
      type: 'normal',
      contexts: ['selection']
    });
  }
});*/

// Open a new search tab when the user clicks a context menu
/*chrome.contextMenus.onClicked.addListener((item, tab) => {
  const tld = item.menuItemId; //hopefully...
  const url = new URL(`${tld}${item.selectionText}/`);//new URL(`https://google.${tld}/search`);
  //url.searchParams.set('q', item.selectionText);
  //console.log("da URL be:", url)
  chrome.tabs.create({ url: url.href, index: tab.index + 1 });
});*/

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

  chrome.notifications.create(data.url, {
    "type": data.type,
    "iconUrl": chrome.runtime.getURL("icons/manga-48.png"), //chrome.extension.getURL("icons/manga-48.png"),
    "title": data.title,
    "message": data.content
  });
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


    //umm not even needed it seems as can just continue...beware of potential future issues though(i.e:removing proper stuff)***
    let pageHtml = anotherResult.replace(regexp, "-" )
   
    var parser = new DOMParser();
    var doc = parser.parseFromString(pageHtml, "text/html"); //this.responseText

    //bon toFix ParseError above>>sometimes happes...
    
    
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
          //should lowerCase so that nothing is missed**TODO
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
                //to get first key which is the earliest chapter.
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
                    let lkey = Object.keys(allChapters)[0] //[Object.keys(allChapters).length - 1]  >>this prolly what caused showing earliest chapter instead of latest...toMonitor**
                    notify({
                      type: "basic",
                      title: title,
                      url: allChapters[lkey],
                      content: `New ${lkey} uploaded for ${title}`
                    });
                    saveChapter(title, hashy)
                  } //else {
                   // console.log(`**WARNING** for ${title} have seen`,seen, seen.length, Object.keys(allChapters).length) //when doing check but nothing new...
                  //}
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

  } catch (err){
    console.log("ERROR in fetch...:(")
    console.log(err);
    //should def let me know if this happens!
    notify({
      type: "basic",
      title: "Extension error",
      url: '', //should go to extension?!? chrome://extensions/ || brave://extensions/  **toTest
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