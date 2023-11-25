function openInNewTab() {
	chrome.tabs.create({
		url: chrome.runtime.getURL("../options/dashboard.html")
	});
}

function modifyUrl(add) {
	//console.log("modify"+add);
	//if add == false, remove
	chrome.tabs.query({'active': true}, function (tabs) {
		url = tabs[0].url;

		chrome.storage.local.get("data", function (data) {
		  // if data doesn't exist yet
		  if (!data.data) {
		  	data = {
		  		data: {
		  			mangaTags: []
		  		}
		  	};
		  }
		  var mangaTags = data.data.mangaTags;
		  if (add) {
		  	//add tag
				//console.log("before");
				//console.log(mangaTags);
			  mangaTags.push({
			  	tag: url
			  });
				//console.log("afer");
				//console.log(mangaTags);
			} else {
				//console.log("before");
				//console.log(mangaTags);
				//remove all items that have tag == url
				mangaTags = mangaTags.filter(function(item) {
					return item.tag !== url;
				});
				//console.log("afer");
				//console.log(mangaTags);
			}
			data.data.mangaTags = mangaTags;
		  updateAddMangaButton(add);
		  chrome.storage.local.set(data);
		});
	});
}

function addUrl() {
	modifyUrl(true);
}

function removeUrl() {
	modifyUrl(false);
}

function mouseover() {
	var title = document.getElementById("add-url-title");
	var description = document.getElementById("add-url-description");
	var icon = document.getElementById("add-url-icon");

	var titleRemovePrompt = "Remove Manga";
	var descriptionRemovePrompt = "Remove the current tab's URL from your manga list";

	title.innerHTML = titleRemovePrompt;
	description.innerHTML = descriptionRemovePrompt;
	icon.classList.add("material-remove");
	icon.classList.remove("material-done");
	icon.classList.remove("material-add");
};

function mouseleave() {
	var title = document.getElementById("add-url-title");
	var description = document.getElementById("add-url-description");
	var icon = document.getElementById("add-url-icon");

	var titleAdded = "Manga Added";
	var descriptionAdded = "This manga is in your manga list.";

	title.innerHTML = titleAdded;
	description.innerHTML = descriptionAdded;

	icon.classList.add("material-done");
	icon.classList.remove("material-add");
	icon.classList.remove("material-remove");
};


function updateAddMangaButton(isMangaAdded) {
	var titleAdded = "Manga Added";
	var descriptionAdded = "This manga is in your manga list.";
	var titleAddPrompt = "Add Manga";
	var descriptionAddPrompt = "Add the current tab's URL to your manga list";


	var addurlbutton = document.getElementById("add-url-button");
	var title = document.getElementById("add-url-title");
	var description = document.getElementById("add-url-description");
	var icon = document.getElementById("add-url-icon");

	if (isMangaAdded) {
		//console.log("manga alr added");
		title.innerHTML = titleAdded;
		description.innerHTML = descriptionAdded;
		icon.classList.add("material-done");
		icon.classList.remove("material-add");
		icon.classList.remove("material-remove");

		//change button to detect for 'remove manga' action
		addurlbutton.removeEventListener('click', addUrl);
		addurlbutton.addEventListener('click', removeUrl);
		addurlbutton.addEventListener('mouseover', mouseover);
		addurlbutton.addEventListener('mouseleave', mouseleave);
	} else {
		title.innerHTML = titleAddPrompt;
		description.innerHTML = descriptionAddPrompt;
		icon.classList.add("material-add");
		icon.classList.remove("material-done");
		icon.classList.remove("material-remove");

		addurlbutton.removeEventListener('click', removeUrl);
		addurlbutton.removeEventListener('mouseover', mouseover);
		addurlbutton.removeEventListener('mouseleave', mouseleave);
		addurlbutton.addEventListener('click', addUrl);
	}
}

document.addEventListener('DOMContentLoaded', function () {
	var settingsbutton = document.getElementById("settings-button");
  // console.log(settingsbutton);
  settingsbutton.addEventListener('click', openInNewTab);


  chrome.storage.local.get("data", function (data) {
	  // if data doesn't exist yet
	  if (!data.data) {
	  	updateAddMangaButton(false);
	  } else {
	  	var mangaTags = data.data.mangaTags;

	  	chrome.tabs.query({'active': true}, function (tabs) {
	  		url = tabs[0].url;

	  		var added = false;
	  		for (var i = 0; i < mangaTags.length; i++) {
	  			//console.log(mangaTags[i].tag);
	  			//console.log(url);
	  			if (mangaTags[i].tag == url) {
	  				added = true;
	  				break;
	  			}
	  		}
	  		updateAddMangaButton(added);
	  	});
	  }
	});
});
var manifest = chrome.runtime.getManifest() || chrome.runtime.getManifest(); //browser
console.log("da manifest?", manifest)
if(document.getElementById("test")) {
	document.getElementById("test").innerHTML = 'Manga Notifier <h6>v' ;//+ manifest.version;
}else {
	console.log("ERROR:no test id")
}

