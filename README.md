# Manga Notifier
An extension that provides notifications when new Manga chapters have been released. Currently only checks [Mangakakalot](https://mangakakalot.com/) for updates.

## Instructions
After loading the extension in a manner of your choice, first go to the settings page via the button provided in the toolbar.Add the manga's title as it appears on the front home page. After saving, loading any new page will trigger the first refresh.

**_Note:_** Since the minimum frequency possible in the settings is 30 minutes, any debugging or process observation cannot be undertaken without manually hard coding the frequency to a more convenient value (such as 10-15 seconds). The Debug toggle in the settings currently does nothing, but in a future update the toggle will determine whether to use default frequency or high frequency.

## Features present in extension
1. **Custom Intervals**: Can choose how frequently the extension checks for updates.
2. **Custom Filtering of Series**: The user can provide the titles of the series for which they wish to be notified. Other updates will not result in a notification.

## Browser Compatibility
The following browsers were tested while developing this add-on.
- Google Chrome 61.0.3163.100
- Firefox Quantum 57.0b4
- Firefox 56
- Brave

Any browser of the same or higher version should be able to run the add-on without any issues.

## Notes
Thanks to [Nischay-Pro](https://github.com/Nischay-Pro/manga-notifier) who provided inspiration and base files/icons for this extension. I updated the requiered library and changed how this extension works--using manga titles instead of urls.
This is not release in the web Store at the moment but it might be in the future.
