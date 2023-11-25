  function openInNewTab() {
      chrome.tabs.create({
          url: chrome.runtime.getURL("../options/dashboard.html")
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
      var settingsbutton = document.getElementById("settings-button");
      // console.log(settingsbutton);
      settingsbutton.addEventListener('click', openInNewTab);
  });
