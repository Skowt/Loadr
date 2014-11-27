// Copyright (c) 2014 - Daniel Pietersen - TroubleShootr.net

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Variables
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var debugContextMenu = false; // Debug the context menu clicks
var debugAlarm = false; // Check when the alarm fires

var anyErrors = false; // Check for errors on updating bookmarks
var bookmarkStorageFull = false; // Switch to check if Storage is full or not

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Context Menu Functions
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Context Menu Functions
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function newNotification(title, allowNotifications) {

    // If there's errors, ignore notification setting
    if (anyErrors) {

        if (bookmarkStorageFull) {
        chrome.notifications.create('', { type: 'basic', iconUrl: 'img/icon.png', title: 'Error: ' + title, message: 'Problem adding bookmark. Storage full!' }, function() { return;});
        } else {
        chrome.notifications.create('', { type: 'basic', iconUrl: 'img/icon.png', title: 'Error: ' + title, message: 'Problem adding bookmark. Please try again later or contact developer!' }, function() { return;});
        }

    } else if (allowNotifications == true) {
        chrome.notifications.create('', { type: 'basic', iconUrl: 'img/icon.png', title: title, message: 'Bookmark was added to your list!' }, function() { return;});
    }

}

// onClick Function
function contextClick(info, tab) {

    // Debugging
    if (debugContextMenu) {
        console.log("Item: " + info.menuItemId + " was clicked");
        console.log("Info: " + JSON.stringify(info));
        console.log("Tab: " + JSON.stringify(tab));
        console.log("Menu Item ID: " + info.menuItemId);

        console.log("Title: " + tab.title);
        console.log("Favicon: " + tab.favIconUrl);
        console.log("URL: " + tab.url);
    }

    // Needed Variables
    var newbookmarkTitle = tab.title;
    var newbookmarkfavicon = 'chrome://favicon/' + tab.url;
    var newbookmarkURL = tab.url;

    chrome.storage.sync.get('options', function(optionsReturned) {

        // Get Options variable for 'opt_Notifications'
        if ( optionsReturned.options == undefined || optionsReturned.options['opt_Notifications'] == 'Yes' ) {
            var notification = true;
        } else {
            var notification = false;
        }

        // Select case based on which context menu item was clicked.
        switch (info.menuItemId) {

            case 'options':

                chrome.tabs.create({"url": "options.html", "selected": true});
                break;

            case 'addlink_Everyday':

                var newbookmarkdays = '1111111';
                var newbookmarklists = 'none';

                updateBookmarkStorage ( newbookmarkTitle, newbookmarkfavicon, newbookmarkURL, newbookmarkdays, newbookmarklists);
                newNotification(newbookmarkTitle, notification );
                break;

            case 'addlink_Weekdays':

                var newbookmarkdays = '1111100';
                var newbookmarklists = 'none';

                updateBookmarkStorage ( newbookmarkTitle, newbookmarkfavicon, newbookmarkURL, newbookmarkdays, newbookmarklists );
                newNotification(newbookmarkTitle, notification );
                break;

            case 'addlink_Weekends':

                var newbookmarkdays = '0000011';
                var newbookmarklists = 'none';

                updateBookmarkStorage ( newbookmarkTitle, newbookmarkfavicon, newbookmarkURL, newbookmarkdays, newbookmarklists );
                newNotification(newbookmarkTitle, notification );
                break;

            case 'addlink_None':

                var newbookmarkdays = '0000000';
                var newbookmarklists = 'none';

                updateBookmarkStorage ( newbookmarkTitle, newbookmarkfavicon, newbookmarkURL, newbookmarkdays, newbookmarklists );
                newNotification(newbookmarkTitle, notification );
                break;
        }

    });


}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Context Menu Creation & Layout
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Create a parent item and two children.
var loadrmenuitem = chrome.contextMenus.create({"title": "Loadr"});
var addtolinks = chrome.contextMenus.create({"title": "Add To Daily Links", "parentId": loadrmenuitem });
var options = chrome.contextMenus.create({"title": "Options", "id": "options" , "parentId": loadrmenuitem, "onclick": contextClick});

// Create selection options for adding links
var selection_everyday = chrome.contextMenus.create({"title": "Everyday", "id": "addlink_Everyday", "parentId": addtolinks,  "onclick": contextClick});
var selection_weekdays = chrome.contextMenus.create({"title": "Weekdays", "id": "addlink_Weekdays", "parentId": addtolinks, "onclick": contextClick});
var selection_weekends = chrome.contextMenus.create({"title": "Weekends", "id": "addlink_Weekends", "parentId": addtolinks, "onclick": contextClick});
var selection_none = chrome.contextMenus.create({"title": "None", "id": "addlink_None", "parentId": addtolinks, "onclick": contextClick});


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// App Badge Settings
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Get Today's Day
function getToday(textOrNumber) {

    var today = new Date();
    var weekday = new Array(7);

    weekday[0]=  "Sunday";
    weekday[1] = "Monday";
    weekday[2] = "Tuesday";
    weekday[3] = "Wednesday";
    weekday[4] = "Thursday";
    weekday[5] = "Friday";
    weekday[6] = "Saturday";

    var todayBadge = weekday[today.getDay()];
    var todayNumber = today.getDay() - 1;

    // If less than 0, it's Sunday
    if (todayNumber < 0) {
        todayNumber = 7;
    }

    if (textOrNumber == 'text') {
        return todayBadge;
    } else {
        return todayNumber;
    }

}

// Set Badge
function currentDayInBadge() {

    // Get todays day and trim
    var todayBadge = getToday('text').substring(0,3);

    // Set badge color and text
    chrome.browserAction.setBadgeBackgroundColor({color: "#0C79E8"}); // Set background badge color
    chrome.browserAction.setBadgeText({text: todayBadge});

    // Get time until tomorrow
    var today = new Date();
    var tomorrow = new Date(today.getFullYear(),
                          today.getMonth(),
                          today.getDate() + 1);

    chrome.alarms.clearAll(); //Clear any alarms

    chrome.alarms.create('dailyBadgeUpdate', { when:  Date.now() +  (tomorrow.getTime() - today.getTime()) });

}

// Create alarm to update badge everyday
chrome.alarms.onAlarm.addListener(function(alarm) {

    // Debug alarm firing
    if (debugAlarm) {
        console.log('Alarm Fired!');
    }

    if (alarm.name == 'dailyBadgeUpdate') {

        currentDayInBadge();

    }

});

// Initialize Badge
currentDayInBadge();

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Bookmark Loading & Saving
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Load Bookmarks into StorageBox.
function updateBookmarkStorage( bookmarkNameOrg, bookmarkFaviconURL, bookmarkURL, days, lists ) {

    // Fill bookmarks thingy.
    chrome.storage.sync.get(null, function(storageItems) {

        var bookmarks = storageItems;
        delete bookmarks.options; // Remove options object from our list of bookmarks

        // Remove spaces from bookmark name
        bookmarkNameOrg = bookmarkNameOrg.trim();

        // Create object name (With no spaces)
        var bookmarkObjName = {};

        // Update values in object
        bookmarkObjName.name = bookmarkNameOrg; // Name
        bookmarkObjName.bookmarkFaviconURL = bookmarkFaviconURL; // Favicon URL
        bookmarkObjName.bookmarkURL = bookmarkURL; // URL
        bookmarkObjName.bookmarkDays = days; // Days
        // To be implemented
        bookmarkObjName.bookmarkLists = 'none'; // Lists
        // bookmarkObjName.bookmarkLists = lists; // Lists

        bookmarks[bookmarkObjName.name] = bookmarkObjName; // Add the bookmarks to our list of bookmarks

        ///////////////////////////////////////////////////////////////////////////

        // Sync bookmarks Array
        chrome.storage.sync.set(bookmarks, function() {

            if (chrome.extension.lastError) {
                if (debugContextMenu) {
                    console.log('[' + bookmarkObjName['name'] + '] Problem Adding/Updating bookmark to Array: ' + chrome.extension.lastError.message);
                }

                // Add switch if storage is full.
                if (chrome.extension.lastError.message == 'QUOTA_BYTES_PER_ITEM quota exceeded') {
                    bookmarkStorageFull = true;
                } else {
                    bookmarkStorageFull = false;
                }

                anyErrors = true;
            } else {

                if (debugContextMenu) {
                    console.log('[' + bookmarkObjName['name'] + '] Successfully added/updated bookmark to array.');
                }
                anyErrors = false;
            }

        });


    });

}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Get Today's Bookmarks
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// onClick checker for browser icon
chrome.browserAction.onClicked.addListener(function() {

    chrome.storage.sync.get('options', function(optionsReturned) {

        // Get Options variable for 'opt_LoadLinks'
        if ( optionsReturned.options == undefined || optionsReturned.options['opt_LoadLinks'] == 'New Tab'  ) {
            chrome.windows.getCurrent(function (window) { loadBookmarks(window,false); });

        } else {
            chrome.windows.create({ 'focused': true, }, function (window) { loadBookmarks(window,true); });
        }

    });

});

// Load Bookmarks
function loadBookmarks(window, newWindow) {

    var today = new Date();
    var dayNumber = getToday('number');

    // Fill bookmarks thingy.
    chrome.storage.sync.get(null, function(bookmarksReturned) {

        // Get bookmarks
        var bookmarks = bookmarksReturned;
        delete bookmarks.options; // Remove options obj from returned bookmarks

        // Create count
        var count = 0;

        for ( bookmark in bookmarks) {

            // If greater than zero, it means there are bookmarks, therefore stop counting.
            if (count < 1) {
                count++;
            } else {
                continue;
            }
        }

        if (count < 1) {

            if (debugContextMenu) {
                console.log('Bookmarks in storage empty. No selected links found.');
            }

            // Redirect to options page if empty
            chrome.tabs.create({"url": 'options.html', "selected": true});

        } else {

            // Check how many bookmarks get opened. If none, display notification.
            var bookmarkOpenCount = 0;

            for (bookmark in bookmarks) {

                if (bookmarks[bookmark].bookmarkDays[dayNumber] == '1') {
                    chrome.tabs.create({"url": bookmarks[bookmark].bookmarkURL, "windowId": window.id, "selected": false});
                    bookmarkOpenCount++;
                    sleep(150);
                }

            }

            if (bookmarkOpenCount < 1) {
                chrome.notifications.create('', { type: 'basic', iconUrl: 'img/icon.png', title: 'Sorry...', message: 'No bookmarks selected to open today.' }, function() {});
            }

        }

        // Remove the first tab since it's the home page,
        if (newWindow) {
            chrome.tabs.getAllInWindow(window.id, function(tabs) {
                chrome.tabs.remove(tabs[0].id);
            });
        }

    });

}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Notification onClick Function
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

chrome.notifications.onClicked.addListener(function() {

    // Redirect to options.html page on Notifications click
    chrome.tabs.create({"url": 'options.html', "selected": true});

});
