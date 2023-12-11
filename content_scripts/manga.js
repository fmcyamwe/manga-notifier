
function onGot(item) {
  var frequency = 1;
  if (item.frequency !== void 0) {
    frequency = item.frequency;
  }
  // single call to start the sync loop
  console.log("euh where?...bout to sendMessage:"+frequency)
  chrome.runtime.sendMessage({}); //browser
}

var getting = chrome.storage.local.get("data"); //browser
getting.then(onGot, function (error) {
  console.log(error);
});

console.log("euh where?!?")