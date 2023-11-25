# Manga Notifier
An extension that provides notifications when new Manga chapters have been released. Currently only checks [Mangafox](https://mangafox.la/releases) for updates.

## Instructions
After loading the extension in a manner of your choice, first go to the settings page via the button provided in the toolbar. This setup is necessary for the extension to know which URLs to listen to. The URLs must be direct links to that Manga's series page viz [The Gamer](https://mangafox.la/manga/the_gamer). After saving, loading any new page will trigger the first refresh.

**_Note:_** Since the minimum frequency possible in the settings is 1 hour, any debugging or process observation cannot be undertaken without manually hard coding the frequency to a more convenient value (such as 10-15 seconds). The Debug toggle in the settings currently does nothing, but in a future update the toggle will determine whether to use default frequency or high frequency.

## Features present in extension
1. **Custom Intervals**: Can choose how frequently the extension checks for updates.
2. **Custom Filtering of Series**: The user can provide the titles of the series for which they wish to be notified. Other updates will not result in a notification.

## Browser Compatibility
The following browsers were tested while developing this add-on.
- Google Chrome 61.0.3163.100
- Microsoft Edge 15 on Windows 10 1703
- Firefox Quantum 57.0b4
- Firefox 56

Any browser of the same or higher version should be able to run the add-on without any issues. If you have found any bug and wish to report please file a bug report in the [Issue Tracker](https://github.com/Nischay-Pro/manga-notifier/issues).

## Notes
The features we plan to add, and other changes which are scheduled, can be viewed in the [Issues](https://github.com/Nischay-Pro/manga-notifier/issues) section. Feel free to add any changes you would like us to implement.
