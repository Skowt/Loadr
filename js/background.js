// Copyright (c) 2015 - Daniel Pietersen - TroubleShootr.net

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

// Replace synchronous sleep with async delay
function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Notification Event Listeners (Must be at top level for Manifest V3)
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Handle notification clicks - redirect to appropriate page based on notification type
chrome.notifications.onClicked.addListener(function(notificationId) {
    if (notificationId === 'update-notification') {
        // For update notifications, redirect to Chrome Web Store
        chrome.tabs.create({"url": 'https://chrome.google.com/webstore/detail/loadr-daily-links/aikmakbdhkfnfjhjbhakiipegcminlco', "selected": true});
    } else {
        // For other notifications, redirect to options page
        chrome.tabs.create({"url": 'options.html', "selected": true});
    }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Context Menu Functions
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function newNotification(title, allowNotifications) {

    // If there's errors, ignore notification setting
    if (anyErrors) {

        if (bookmarkStorageFull) {
            chrome.notifications.create('', {
                type: 'basic',
                iconUrl: chrome.runtime.getURL('img/icon.png'),
                title: 'Error: ' + title,
                message: 'Problem adding bookmark. Storage full!'
            });
        } else {
            chrome.notifications.create('', {
                type: 'basic',
                iconUrl: chrome.runtime.getURL('img/icon.png'),
                title: 'Error: ' + title,
                message: 'Problem adding bookmark. Please try again later or contact developer!'
            });
        }

    } else if (allowNotifications == true) {
        chrome.notifications.create('', {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('img/icon.png'),
            title: title,
            message: 'Bookmark was added to your list!'
        });
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
    var newbookmarkfavicon = tab.favIconUrl;
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
var loadrmenuitem = chrome.contextMenus.create({"title": "Loadr", "id": "loadrmenuitem"});
var addtolinks = chrome.contextMenus.create({"title": "Add To Daily Links", "id": "addtolinks", "parentId": loadrmenuitem });
var options = chrome.contextMenus.create({"title": "Options", "id": "options" , "parentId": loadrmenuitem});

// Create selection options for adding links
var selection_everyday = chrome.contextMenus.create({"title": "Everyday", "id": "addlink_Everyday", "parentId": addtolinks});
var selection_weekdays = chrome.contextMenus.create({"title": "Weekdays", "id": "addlink_Weekdays", "parentId": addtolinks});
var selection_weekends = chrome.contextMenus.create({"title": "Weekends", "id": "addlink_Weekends", "parentId": addtolinks});
var selection_none = chrome.contextMenus.create({"title": "None", "id": "addlink_None", "parentId": addtolinks});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(contextClick);


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
        todayNumber = 6;
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
    chrome.action.setBadgeBackgroundColor({color: "#0C79E8"}); // Set background badge color
    chrome.action.setBadgeText({text: todayBadge});

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

        // Check if bookmark exists, if so, add hiphen
        if (typeof(bookmarks[bookmarkObjName.name]) == 'object' && bookmarkObjName.bookmarkURL != bookmarks[bookmarkObjName.name].bookmarkURL) {

            // Keep the bookmark title from the first check so we can use it to find all the partial titles in our bookmarks obj.
            var bookmarkOriginal = bookmarkObjName.name.trim();

            // If titles are the same, go through all bookmarks to find ones with this title in it.
            // If we find one and the URL's match, skip adding this link.
            // If we go through all of them and non match, increment name.
            for (bookmark in bookmarks) {

                // If Database bookmark title contains the current title, do...
                if ( ~bookmarks[bookmark].name.trim().indexOf(bookmarkOriginal) ) {

                    // If URL's match. skip adding link to bookmarks.
                    if ( bookmarks[bookmark].bookmarkURL == bookmarkObjName.bookmarkURL ) {

                        bookmarkObjName.name = bookmarks[bookmark].name.trim();
                        break;

                    }

                }


            }

            // If we didn't find a bookmark with matching URL's, we increase until we find an empty. object.
            if (bookmarkObjName.name == bookmarkOriginal) {

                // Add hiphen and number to it if URL's don't match
                for ( var i = 1; i < 10000; i++ ) {

                    if (typeof(bookmarks[bookmarkObjName.name.trim() + " - " + i] ) != "object") {

                        bookmarkObjName.name = bookmarkObjName.name.trim() + " - " + i;
                        break;

                    }

                }
            }


        }

        bookmarks[bookmarkObjName.name] = bookmarkObjName; // Add the bookmarks to our list of bookmarks

        ///////////////////////////////////////////////////////////////////////////

        // Sync bookmarks Array
        chrome.storage.sync.set(bookmarks, function() {

            if (chrome.runtime.lastError) {
                if (debugContextMenu) {
                    console.log('[' + bookmarkObjName['name'] + '] Problem Adding/Updating bookmark to Array: ' + chrome.runtime.lastError.message);
                }

                // Add switch if storage is full.
                if (chrome.runtime.lastError.message == 'QUOTA_BYTES_PER_ITEM quota exceeded') {
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
chrome.action.onClicked.addListener(function() {

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
async function loadBookmarks(window, newWindow) {

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

            // Process bookmarks sequentially with delay
            processBookmarks(bookmarks, dayNumber, window.id).then(function(count) {
                bookmarkOpenCount = count;

                if (bookmarkOpenCount < 1) {
                    chrome.notifications.create('', {
                        type: 'basic',
                        iconUrl: chrome.runtime.getURL('img/icon.png'),
                        title: 'Sorry...',
                        message: 'No bookmarks selected to open today.'
                    });
                }
            });

        }

        // Remove the first tab since it's the home page,
        if (newWindow) {
            chrome.tabs.getAllInWindow(window.id, function(tabs) {
                chrome.tabs.remove(tabs[0].id);
            });
        }

    });

}

// Helper function to process bookmarks with delay
async function processBookmarks(bookmarks, dayNumber, windowId) {
    let count = 0;

    for (let bookmark in bookmarks) {
        if (bookmarks[bookmark].bookmarkDays[dayNumber] == '1') {
            chrome.tabs.create({"url": bookmarks[bookmark].bookmarkURL, "windowId": windowId, "selected": false});
            count++;
            await delay(150);
        }
    }

    return count;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Notification onClick Function
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Pop up on Extension updated Function
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
chrome.runtime.onInstalled.addListener(function(ReturnedStatus) {

    if (ReturnedStatus['reason'] == 'update') {

        // Create an alert when Loadr is updated
        chrome.notifications.create('update-notification', {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('img/icon.png'),
            title: 'Loadr Update Installed',
            message: 'Click here to view the latest changes.'
        });

    }

});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Load Links on Chrome Start Function
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Load bookmarks when Chrome starts up (not on new windows)
chrome.runtime.onStartup.addListener(function() {

    chrome.storage.sync.get('options', function(optionsReturned) {

        if ( optionsReturned.options != undefined && optionsReturned.options['opt_OpenLinks'] == 'On Chrome Start'  ) {
            // Create a new window and load bookmarks into it
            chrome.windows.create({ 'focused': true, }, function (window) {
                loadBookmarks(window, true);
            });
        }

    });

});