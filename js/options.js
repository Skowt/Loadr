// Copyright (c) 2014 - Daniel Pietersen - TroubleShootr.net

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Contents
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// 1. Variables
// 2. Debugging Tools
//
// 3. Loading & Saving Options
// 3.1 Options Functions
//
// 4. Bookmark Storage Functions
// 4.1 Loading Bookmarks
// 4.2 Bookmark Generation Function
//
// 5. 'Manual Link' Functions
// 6. 'Selected Link' Functions
// 7. 'My Bookmark' Functions
//
// 8. Misc. Functions
// 9. Initializing Function
// 10. 'In Progress' Functions
//
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// 1. Variables
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Debugging
var debug = false; // Enable Debugging if required.
var bookmarkDebug = false; // Debug bookmark gathering
var bookmarkDebugAlreadyFound = false; // Debug bookmark gathering actions when bookmark already in 'Selected Links'
var debugStorage = false; // List all the currently stored settings
var debugSubfolders = false; // Debug sub-folder styling and generation
var debugDayCalculator = false; // Debug the Day selector counter;

// Error Checking
anyErrors = false; // Check if there's errors
errorFadeOut = true; // Fade off errors if success, don't if warning or danger

// Create objects
var bookmarks = {}; // Create Bookmarks Object

// Create Storage Box and add objects
var optionsPackage = { 'options' : {} };

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// 2. Debugging Tools
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Get All Storage [Debug Only]
if (debugStorage) {

    chrome.storage.sync.get(null, function(items) {
        var allKeys = Object.keys(items);
        console.log("All stored Options: " + allKeys);
    });

}

// Detect changes in Chromes storage
chrome.storage.onChanged.addListener(function(changes, namespace) {

    // Announce all storage changes
    if (debugStorage) {
        for (key in changes) {
          var storageChange = changes[key];
          console.log('Storage key "%s" in namespace "%s" changed. ' +
                      'Old value was "%s", new value is "%s".',
                      key,
                      namespace,
                      storageChange.oldValue,
                      storageChange.newValue);
        }
    }

});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// 3. Loading & Saving Options
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Loading Options
function loadOptions() {

    chrome.storage.sync.get('options', function(optionsReturned) {

        // Check if options aren't set.
        var count = 0;

        for ( i in optionsReturned.options) {

            if (count < 1) {
                count++;
            } else {
                continue;
            }

        }

        if (count < 1) {
            // If options are empty, return nothing.
        } else {
            optionsPackage.options = optionsReturned['options'];
        }

        // Get all ID's on page starting with '_opt'
        $('[id^=opt_]').each(function() {
            // Storage syntax example
            // option[optID] translates to: options[opt_LoadLinks]
            var optID = $(this).attr("id"); // E.g. opt_LoadLinks

            if (optionsPackage.options[optID] == undefined) {

                switch (optID) {

                    case 'opt_LoadLinks':

                        saveOptions( optID, 'New Tab' )
                        break;

                    case 'opt_Notifications':

                        saveOptions( optID, 'Yes' )
                        break;

                }

            }

            if (debug) {
                console.log('Option ID "' +  optID + '" returned this value from storage: ' + optionsPackage.options[optID]);
            }

             // Update Dropdown box
            if (debug) {
                console.log('Setting Label to: ' + optionsPackage.options[optID]);
            }

            $("#" + optID).find( '[data-bind="label"]' ).text( optionsPackage.options[optID] )

        });

    });

}

// Saving Options
function saveOptions( optionToSave, value ) {

    // Add new setting to object
    optionsPackage.options[optionToSave] = value;

    if (debug) {
        console.log("===== Change Detected ===== ");
        console.log("Option: " + optionToSave);
        console.log("Value: \"" + value + "\"");
    }

    chrome.storage.sync.set(optionsPackage, function() {

        if (chrome.extension.lastError) {

            if (debug) {
                console.log('Problem Saving Options: ' + chrome.extension.lastError.message);
            }

            // Add switch if bookmark storage is full
            if (chrome.extension.lastError.message == 'QUOTA_BYTES_PER_ITEM quota exceeded') {
                bookmarkStorageFull = true;
            } else {
                bookmarkStorageFull = false;
            }

            anyErrors = true;

        } else {

            if (debug) {
                console.log('Successfully saved option.');
            }
            anyErrors = false;
        }

    });

}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// 3.1 Options Functions
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Make the dropdown box work like it should for 'Load Links'
$(".dropdown-menu li").click( function( event ) {

    var $target = $( event.currentTarget );

    $target.closest( '.btn-group' )
      .find( '[data-bind="label"]' ).text( $target.text() )
         .end()
      .children( '.dropdown-toggle' ).dropdown( 'toggle' );

    var optionID = $target.closest( '.btn-group' ).find('.btn:first-child').attr('id').trim();

    // Save Settings for 'Load Links' option
    saveOptions(optionID, $target.text());

    if (anyErrors) {

        // Check if bookmarkStorage is full
        if (bookmarkStorageFull) {

            // Show alert with Danger!
            var newAlert = '<div class="alert alert-danger alert-dismissible fade in out alertCustom alertCustomBookmarkStorageFull" role="alert">' +
              '<button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' +
              '<strong>ERROR!</strong> Updating storage failed. Bookmark Storage is full! Please remove some selected bookmarks.' +
            '</div>'

        } else {

            // Show alert with Danger!
            var newAlert = '<div class="alert alert-danger alert-dismissible fade in out alertCustom alertCustomDanger" role="alert">' +
              '<button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' +
              '<strong>ERROR!</strong> Updating storage failed. Try again or contact developer!' +
            '</div>'

        }

        errorFadeOut = false; // Don't fade out alerts as it's a danger

    } else {

        // Show alert saying success!
        var newAlert = '<div class="alert alert-success alert-dismissible fade in out alertCustom alertCustomOptions" role="alert">' +
          '<button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' +
          '<strong>Success!</strong> Your options have been saved!' +
        '</div>';
        errorFadeOut = true; // Fade alerts as it's successful.


    }

    if (errorFadeOut) {
        // Fade out alerts after delay
        $(newAlert).appendTo('#optionsAlert').fadeIn('medium', function() {
            $(this).delay(4000).fadeOut(1000,"swing");
        });
    } else {
        // Don't fade out if error.
        $(newAlert).appendTo('#optionsAlert').fadeIn('medium');
    }

});

// Prevent form submission
$(".form-horizontal").submit(function(form) {
    form.preventDefault();
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// 4. Bookmark Storage Functions
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Saving Bookmarks
function updateBookmarkStorage ( bookmarkNameOrg, bookmarkFaviconURL, bookmarkURL, days, lists ) {

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

    bookmarks[bookmarkObjName.name] = bookmarkObjName; // Add the bookmarks to our list of bookmarks

    ///////////////////////////////////////////////////////////////////////////

    // Sync bookmarks Array
    chrome.storage.sync.set(bookmarks, function() {

        if (chrome.extension.lastError) {

            if (debug) {
            console.log('[' + bookmarkObjName['name'] + '] Problem Adding/Updating bookmark to Array: ' + chrome.extension.lastError.message);
            }
            anyErrors = true;

            // Add switch if bookmark storage is full
            if (chrome.extension.lastError.message == 'QUOTA_BYTES_PER_ITEM quota exceeded') {
                bookmarkStorageFull = true;
            } else {
                bookmarkStorageFull = false;
            }

        } else {

            if (debug) {
                console.log('[' + bookmarkObjName['name'] + '] Successfully added/updated bookmark to array.');
            }
            anyErrors = false;

        }

    });

}

// Removing Bookmarks
function removeBookmarkFromStorage ( bookmarkName ) {

    // Remove spaces from bookmark name
    bookmarkName = bookmarkName.trim();

    // Remove bookmark from variable
    delete bookmarks[bookmarkName];

    // Sync bookmarks Array
    chrome.storage.sync.remove(bookmarkName, function() {

        if (chrome.extension.lastError) {
            console.log('[ ' + bookmarkName + '] Problem removing bookmark from Array: ' + chrome.extension.lastError.message);
            anyErrors = true;
        } else {

            if (debug) {
                console.log('[ ' + bookmarkName + '] Successfully removed bookmark from array.');
            }
            anyErrors = false;
        }

    });

}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// 4.1 Loading Bookmarks
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Get bookmarks from storage and load into selected links.
function loadBookmarks() {

    if (debug) {
        console.log("Getting bookmarks from storage.");
    }

    chrome.storage.sync.get(null, function(storageItems) {

        // Get bookmarks
        bookmarks = storageItems;
        delete bookmarks.options; // Remove options from bookmark object;

        // Create Count
        var count = 0;

        for ( bookmark in bookmarks) {

            if (count < 1){
                count++;
            } else {
                continue;
            }

        }

        if (count < 1) {

            if (debugStorage) {
                console.log('Bookmarks in storage empty. No selected links found.');
            }

            return;
        }

        // For each bookmark, add to Selected links
        for (bookmark in bookmarks) {

            var selectedBookmark = {};

            selectedBookmark.name = bookmarks[bookmark].name;
            selectedBookmark.bookmarkFaviconURL = bookmarks[bookmark].bookmarkFaviconURL;
            selectedBookmark.bookmarkURL = bookmarks[bookmark].bookmarkURL;
            selectedBookmark.bookmarkDays = bookmarks[bookmark].bookmarkDays;
            selectedBookmark.bookmarkLists = bookmarks[bookmark].bookmarkLists;


            if (selectedBookmark.name != '') {
                // generateSelectedLink( appendTo, bookmarkName, BookmarkFaviconURL, bookmarkURL, bookmarkDays, subFolder , isChecked )
                generateSelectedLink( '.selectedLinksGather', selectedBookmark.name, selectedBookmark.bookmarkFaviconURL, selectedBookmark.bookmarkURL,
                                      selectedBookmark.bookmarkDays , '' , true );
            }

        };

        // Show Day Selector for bookmark
        $('.selectedLinksGather .myBookmarksSingleRow').each(function () {
            $(this).find("#myBookmarksDaySelectorRow").show(200, "swing");
        })

    });

}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// 4.2 Bookmark Generation Function
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var masterId = "1"; // The main Parent ID for the bookmarks
var lastFolderId = ''; // Remember the last folder ID for bookmarks
var subFolderLevel = 0; // Generates levels of subfolder
var masterSubFolder = 0; //Get current folder ID
var isSubfolder = false; // Indent if sub-folder

// Get all Users Bookmarks
function printBookmarks(bookmarkBar) {

  bookmarkBar.forEach(function(UserBookmark) {

    if (UserBookmark.url == undefined && UserBookmark.title != "Bookmarks bar" && UserBookmark.title != "") {

        // Current folder's parent
        currentParent = UserBookmark.parentId;

        // Debug Test
        if (bookmarkDebug) {
          console.log ("========= FOLDER ========");
          console.log(bookmark.id + ' - ' + UserBookmark.title);
          console.log("Bookmark Title: " + UserBookmark.title);
          console.log("Bookmark ID: " + UserBookmark.id);
        }

        // Special styling if folder is a sub-folder
        if ( currentParent != masterId ) {

            // Must be a sub-folder, not a folder!
            isSubFolder = true;

            // SubFolder 1 is the first level of sub-folders
            if ( subFolderLevel < 1 ) {

                if (debugSubfolders) {
                    console.log('New Sub-folder!');
                }

                masterSubFolder = currentParent; // As this is the first sub-folder, it's parent must be the main folder
                subFolderLevel++;

            } else {

                // If we go deeper, increase and vice versa.
                if ( currentParent != masterSubFolder) {
                    subFolderLevel++;
                }

                // Fail-safe [ Max subfolders = 3 ]
                if ( subFolderLevel > 3 ) {
                    subFolderLevel = 3;
                }

            }

            $('.myBookmarksGather').append('<h5 class="subfolder" id="sub-folder-' + subFolderLevel + '">' + UserBookmark.title + '</h5>');
            lastFolderId = UserBookmark.id; // Update current parentID

        } else {

            // Is just a folder not a sub-folder
            $('.myBookmarksGather').append('<hr>\n<h4>' + UserBookmark.title + '</h4>');
            lastFolderId = UserBookmark.id; // Update current parentID
            subFolderLevel = 0; // Reset sub-folder level
            isSubfolder = false; // No longer in a sub-folder
        }

    } else if (UserBookmark.title != "Bookmarks bar" && UserBookmark.title != "") {

        currentParent = UserBookmark.parentId;
        UserBookmark.title = UserBookmark.title.trim(); // Remove whitespace from titles

        if ( lastFolderId != currentParent ) {

            // Going down a subfolder level.
            subFolderLevel -= 1;

            if (debugSubfolders) {
                console.log("LAST: " + lastParentId);
                console.log("CURRENT: " + currentParent);
            }

            if (currentParent == masterId) {
                isSubfolder = false; // Switch back as we're leaving a subfolder.
                $('.myBookmarksGather').append('<hr>'); // Add a line break if we're going back to master folder.

            } else {
                $('.myBookmarksGather').append('<br />');
            }

            lastFolderId = currentParent;

        }

        // Debug Test
        //  console.log(bookmark.id + ' - ' + bookmark.title + ' - ' + bookmark.url);

        // Check if bookmark already in list
        if (typeof(bookmarks[UserBookmark.title]) == "object") {

            var tempURL = UserBookmark.url.trim();
            tempURL = UserBookmark.url.replace(/\s/g, ''); // Remove all spaces

            // Debug Code
            if (bookmarkDebugAlreadyFound) {
                console.log("===================");
                console.log("DB Name: " + bookmarks[UserBookmark.title].name);
                console.log("Gen Name: " + UserBookmark.title.trim());
                console.log("DB URL: " + bookmarks[UserBookmark.title].bookmarkURL);
                console.log("Gen URL: " + UserBookmark.url);
            }

            // Check if URL and Title match. If true, skip it. If not, add it and add '- integer'
            if ( bookmarks[UserBookmark.title].name == UserBookmark.title.trim() && bookmarks[UserBookmark.title].bookmarkURL == tempURL) {

                // If bookmark already exists, skip adding it.
                if (debug) {
                    console.log('Bookmark already in selected links. Skipping.');
                }
                return;


            } else if ( bookmarks[UserBookmark.title].name == UserBookmark.title.trim() ) {

                // Keep the bookmark title from the first check so we can use it to find all the partial titles in our bookmarks obj.
                var bookmarkOriginal = UserBookmark.title.trim();

                // If titles are the same, go through all bookmarks to find ones with this title in it.
                // If we find one and the URL's match, skip adding this link.
                // If we go through all of them and non match, increment name.
                for (bookmark in bookmarks) {

                    // If Database bookmark title contains the current title, do...
                    if ( ~bookmarks[bookmark].name.trim().indexOf(bookmarkOriginal) ) {

                        // If URL's match. skip adding link to bookmarks.
                        if ( bookmarks[bookmark].bookmarkURL == tempURL ) {

                            // Duplicate link. Ignoring.
                            if (debug) {
                                console.log('Bookmark already in selected links. Skipping.');
                            }
                            return;

                        } else {

                            // Add hiphen and number to it if URL's don't match
                            for ( var i = 1; i < 10000; i++ ) {

                                if (typeof(bookmarks[UserBookmark.title.trim() + " - " + i] ) != "object") {

                                    UserBookmark.title = UserBookmark.title.trim() + " - " + i;
                                    break;

                                }

                            }

                        }


                    }

                }

            }

        }


        favicon = 'chrome://favicon/' + UserBookmark.url;

        if ( subFolderLevel > 0 ) {
            subFolder = 'id="sub-folder-' + subFolderLevel + '"';
        } else {
            subFolder = '';
        }

        // Generate link
        //generateSelectedLink( appendTo, bookmarkName, BookmarkFaviconURL, bookmarkURL, bookmarkDays , subFolder , isChecked )
        generateSelectedLink( '.myBookmarksGather', UserBookmark.title, favicon, UserBookmark.url, '' , subFolder , false )

    }

    if (UserBookmark.children) {
        printBookmarks(UserBookmark.children);
    }

  });
};


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// 5. 'Manual Link' Functions
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Show 'Add Bookmark' button when form filled in for "Add Manual Link"
$('form').on('input', function() {

    // Debug 'Add Manual Link' input form
    if (debug) {
        console.log("Add Manual Link Title Field Test: " + $('form #addManualLinkTitle').val());
        console.log("Add Manual Link URL Field Test: " + $('form #addManualLinkURL').val());
    }

    if ( $('form #addManualLinkTitle').val() != "" && $('form #addManualLinkURL').val() != "" ) {
        $( "#addManualBookmark" ).show(400, "swing");
    } else {
        $( "#addManualBookmark" ).hide(400, "swing");
    }

});

// Add Manual bookmark to 'Selected Links'
$( "#addManualBookmark" ).click( function() {

    // Create empty object
    var newManualBookmark = {};

    // Check for spaces
    newManualBookmark.bookmarkURL = $('#addManualLinkURL').val().trim();
    newManualBookmark.bookmarkURL = newManualBookmark.bookmarkURL.replace(/\s/g, ''); // Remove all spaces

    newManualBookmark.name = $('#addManualLinkTitle').val().trim();
    newManualBookmark.bookmarkFaviconURL = 'chrome://favicon/' + newManualBookmark.bookmarkURL;
    newManualBookmark.bookmarkDays = '0000000';
    newManualBookmark.bookmarkLists = 'none';

    // Check for iterations of object, add numbers if needed.
    if (typeof(bookmarks[bookmarkName.trim()]) == "object") {

        for ( var i = 1; i < 10000; i++ ) {

            if (typeof(bookmarks[newManualBookmark.name] + " - " + i) != "object") {

                var bookmarkNameOrg = newManualBookmark.name + " - " + i;
                break;

            }

        }

    }

    // Update Storage
    updateBookmarkStorage ( bookmarkNameOrg, newManualBookmark.bookmarkFaviconURL, newManualBookmark.bookmarkURL, newManualBookmark.bookmarkDays, newManualBookmark.bookmarkLists )

    // Generate 'Selected Link'
    generateSelectedLink( '.selectedLinksGather', bookmarkNameOrg, newManualBookmark.bookmarkFaviconURL, newManualBookmark.bookmarkURL, '000000', '', true );

    // Show Day Selector for bookmark
    $('.selectedLinksGather .myBookmarksMainCheckbox').each(function () {

        if ($(this).prop('checked')) {

            // Show Day Selector for bookmark
             $(this).closest('.myBookmarksSingleRow').find("#myBookmarksDaySelectorRow").show(200, "swing");

        } else {

            // Show Day Selector for bookmark
             $(this).closest('.myBookmarksSingleRow').find("#myBookmarksDaySelectorRow").hide(200, "swing");

        };

    })

    // Hide after bookmarks added.
    $("#addManualBookmark").hide(400, "swing");

    // Clear form
    $('#addManualLinkTitle').val('');
    $('#addManualLinkURL').val('http://');

    // Scroll to selected links on add
    $('html, body').animate({
        scrollTop: $('.selectedLinks').offset().top
    }, 1500);

});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// 6. 'Selected Link' Functions
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Show 'Save Changes' when anything is clicked in "Selected Links"
$( ".selectedLinksGather" ).click(function() {

    // Prevent Double-Clicking
    if ( event.target.tagName === "IMG" ) {
         return;
    }

    // Show "Save Changes" if 'Selected Links' are changed.
    // Positioned here so it appears only after bookmark has moved.
    $("#saveChangesSelectedLinks").show(400, "swing");

});


// Hide 'Day Selector' for links in 'Selected Links' if main checkbox is unticked
$( ".selectedLinksGather" ).on("click", ".myBookmarksMainCheckbox", function() {

    // Prevent Double-Clicking
    if ( event.target.tagName === "IMG" ) {
         return;
    }

    if ($(this).closest(".myBookmarksMainCheckbox").prop('checked')) {

        // Show Day Selector for bookmark
         $(this).closest('.myBookmarksSingleRow').find("#myBookmarksDaySelectorRow").show(200, "swing");

    } else {

        // Show Day Selector for bookmark
         $(this).closest('.myBookmarksSingleRow').find("#myBookmarksDaySelectorRow").hide(200, "swing");

    };

});

// Update bookmarks on 'Save Changes' button click.
$( "#saveChangesSelectedLinks" ).click( function() {

    // Error check
    var anyEmptyDays = false; // Checks if a bookmarks has no days selected and if so, warns user.

    // Prevent Double-Clicking
    if ( event.target.tagName === "IMG" ) {
         return;
    }

    $(".selectedLinksGather .myBookmarksMainCheckbox").each(function() {

        if ($(this).prop('checked')) {

            // Debug Test
            if (debug) {
              console.log("Bookmark Checked. Updating Storage.");
            };

            // Update Bookmark in storage
            var bookmarkName = $(this).closest('.myBookmarksSingleRow').find("label").prop('innerText'.trim());
            var faviconURL = $(this).closest('.myBookmarksSingleRow').find(".myBookmarksFavicon").prop('src');
            var bookmarkURL = $(this).closest('.myBookmarksSingleRow').find("a").prop('href');
            var bookmarkDays = calculateDays($(this).closest('.myBookmarksSingleRow'));
            var bookmarkLists = 'none';

            updateBookmarkStorage( bookmarkName, faviconURL, bookmarkURL, bookmarkDays, bookmarkLists );

        } else {

            // Remove from view
            $(this).closest('.myBookmarksSingleRow').fadeOut('medium',function () {
                $(this).closest('.myBookmarksSingleRow').remove();
            });

            // Get Bookmark name and remove from storage
            var bookmarkName = $(this).closest('.myBookmarksSingleRow').find("label").prop('innerText'.trim());
            removeBookmarkFromStorage(bookmarkName);

        }

    });

    // Hide "Save Changes" after changes applied
    $("#saveChangesSelectedLinks").hide(400, "swing");

    // Check for errors and alert
    if (anyErrors == true) {

        // Check if bookmarkStorage is full
        if (bookmarkStorageFull) {

            // Show alert with Danger!
            var newAlert = '<div class="alert alert-danger alert-dismissible fade in out alertCustom alertCustomBookmarkStorageFull" role="alert">' +
              '<button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' +
              '<strong>ERROR!</strong> Updating storage failed. Bookmark Storage is full! Please remove some selected bookmarks.' +
            '</div>'

        } else {

            // Show alert with Danger!
            var newAlert = '<div class="alert alert-danger alert-dismissible fade in out alertCustom alertCustomDanger" role="alert">' +
              '<button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' +
              '<strong>ERROR!</strong> Updating storage failed. Try again or contact developer!' +
            '</div>'

        }

        errorFadeOut = false; // Don't fade alerts as there's errors

    } else {

        if (anyEmptyDays) {

            // Show alert with warning!
            var newAlert = '<div class="alert alert-warning alert-dismissible fade in out alertCustom alertCustomWarning" role="alert">' +
              '<button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' +
              '<strong>Careful!</strong> One or more bookmarks have no days selected. This means they will never show up!<br /> (Your changes have still been saved!)' +
            '</div>'
            errorFadeOut = false; // Don't fade alerts as there's errors

        } else {

            // Show alert with success!
            var newAlert = '<div class="alert alert-success alert-dismissible fade in out alertCustom" role="alert">' +
              '<button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' +
              '<strong>Success!</strong> Bookmark changes have been saved.' +
            '</div>'
            errorFadeOut = true; // Fade out alerts as it's successful

        }

    }

    if (errorFadeOut) {
        // Fade out alerts after delay
        $(newAlert).appendTo('#selectedLinkAlert').fadeIn('medium', function() {
           $(this).delay(4000).fadeOut(1000,"swing");
        });
    } else {
        // Don't fade alerts as there must be an issue
        $(newAlert).appendTo('#selectedLinkAlert').fadeIn('medium');
    }


});


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// 7. 'My Bookmark' Functions
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Show 'Add Selected Bookmarks' button on checkbox select.
$( ".myBookmarksGather" ).on("click", ".myBookmarksSingleRow", function() {

     // Prevent Double-Clicking
    if ( event.target.tagName === "IMG" ) {
         return;
    }

    var anyChecked = false; // Create a variable that will check if any of the boxes are checked.

    $(".myBookmarksGather .myBookmarksMainCheckbox").each(function() {

        // return immediately if anyChecked equal to true.
        if (anyChecked) {
            return;
        }

        if ($(this).prop('checked')) {

            $(".myBookmarksAddButton").show(400, "swing");
            anyChecked = true;

            if (debug) {
                console.log('Checking each bookmark checkbox');
            }

            return;
        }

    });

    if (anyChecked == false) {
        $(".myBookmarksAddButton").hide(400, "swing");
    }

});


// 'Add Selected Bookmarks' button click.
$( ".myBookmarksAddButton" ).click( function() {

    var listofChecked = {}; // Create a list of checked bookmarks. This will be used to see if we need to add an extension to the bookmark name

    $(".myBookmarksGather .myBookmarksMainCheckbox:checked").each(function() {

                // Debug Test
                if (debug) {
                  console.log("Bookmark Main Checkbox selected");
                };

                // Add Bookmark to Array
                var bookmarkName = $(this).closest('.myBookmarksSingleRow').find("label a").prop('innerText');
                var faviconURL = $(this).closest('.myBookmarksSingleRow').find(".myBookmarksFavicon").prop('src');
                var bookmarkURL = $(this).closest('.myBookmarksSingleRow').find("a").prop('href');
                var bookmarkDays = '0000000';
                var bookmarkLists = 'none';


                // Check for duplicate bookmark names + URLs
                for (bookmark in listofChecked) {

                    // if Name and URL match, don't add it.
                    if (bookmarkName == listofChecked[bookmark].name && bookmarkURL == listofChecked[bookmark].url) {

                        // Skip adding it.
                        return;

                    // if Name matches but URL doesn't, update it.
                    } else if (bookmarkName == listofChecked[bookmark].name) {

                        // Add hiphen and number to it if URL's don't match
                        for ( var i = 1; i < 10000; i++ ) {

                            if (typeof(bookmarks[bookmarkName.trim() + " - " + i] ) != "object") {

                                bookmarkName = bookmarkName.trim() + " - " + i;
                                $(this).closest('.myBookmarksSingleRow').find("label a").prop({ 'innerText': bookmarkName}); // Update label
                                break;

                            }

                        }

                    }

                }

                // Move element to selected links
                $(this).closest('.myBookmarksSingleRow').fadeOut('medium',function () {
                    $(this).closest('.myBookmarksSingleRow').appendTo('.selectedLinksGather').fadeIn('medium',function() {

                    // Show Day Selector for bookmark
                     $(this).closest('.myBookmarksSingleRow').find("#myBookmarksDaySelectorRow").show(200, "swing");

                    // Show "Save Changes" if 'Selected Links' are changed.
                    // Positioned here so it appears only after bookmark has moved.
                    $("#saveChangesSelectedLinks").show(400, "swing");

                    });

                });

                // Add bookmark to list to check
                var tempObj = {};
                tempObj.name = bookmarkName;
                tempObj.url = bookmarkURL;

                listofChecked[tempObj.name] = tempObj;

                updateBookmarkStorage ( bookmarkName, faviconURL, bookmarkURL, bookmarkDays, bookmarkLists )

    });

    // Hide after bookmarks added.
    $(".myBookmarksAddButton").hide(400, "swing");

    // Scroll to selected links on add
    $('html, body').animate({
        scrollTop: $('.selectedLinks').offset().top
    }, 1500);

});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// 8. Misc. Functions
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// 'Selected Link' Generator, with Day Selector added.
function generateSelectedLink( appendTo, bookmarkName, BookmarkFaviconURL, bookmarkURL, bookmarkDays, subFolder , isChecked ) {

    // isChecked will be true if Checkbox must be ticked.
    // isIDSelected will be true if link goes into 'Selected Links' section.

    var checkedString = '';
    var idString = '';

    // Make checkbox checked if 'isChecked' is true
    if (isChecked) {
        checkedString = 'checked';
        idString = 'id="selected"';
    } else {
        checkedString = '';
        idString = '';
    }


    // Calculate Days Selector tickboxes from storage
    if (isChecked) {

        var days = [];

        for ( var i = 0; i < bookmarkDays.length; i++ ) {

            // If character is a 1, then tick Box.
            if (bookmarkDays.charAt(i) == 1) {

                days.push('checked');

            } else {

                days.push('');
            }

        }


    } else {

        var days = [ '','','','','','','' ];

    }

    var newBookmark = //'<!-- SINGLE ROW START -->' +
        '<div class="myBookmarksSingleRow" ' + subFolder + ' ' + idString + '>' +
                '' +
              '<div class="checkbox myBookmarkRowFix">' +
                '<label>' +
                    //'<!-- Selected Bookmark layout. Image Favicon Title with HTML link -->' +
                 '<input type="checkbox" class="myBookmarksMainCheckbox" ' + checkedString + '><img src="' + BookmarkFaviconURL + '" class="myBookmarksFavicon" /> <a href="' + bookmarkURL +'" target="_blank">' + bookmarkName + '</a>' +
                '</label>' +
              '</div>' +
                '' +
              '<div class="checkbox" id="myBookmarksDaySelectorRow">' +
                '<label class="checkbox-inline">' +
                '  <input type="checkbox" name="myBookmarksDayCheckBox" id="daySelectorMonday" value="Mon" ' + days[0] + '>Monday' +
                '</label>' +
                '<label class="checkbox-inline">' +
                '  <input type="checkbox" name="myBookmarksDayCheckBox" id="daySelectorTuesday" value="Tue" ' + days[1] + '>Tuesday' +
                '</label>' +
                '<label class="checkbox-inline">' +
                '  <input type="checkbox" name="myBookmarksDayCheckBox" id="daySelectorWednesday" value="Wed" ' + days[2] + '>Wednesday' +
                '</label>' +
                '<label class="checkbox-inline">' +
                '  <input type="checkbox" name="myBookmarksDayCheckBox" id="daySelectorThursday" value="Thur" ' + days[3] + '>Thursday' +
                '</label>' +
                '<label class="checkbox-inline">' +
                '  <input type="checkbox" name="myBookmarksDayCheckBox" id="daySelectorFriday" value="Fri" ' + days[4] + '>Friday' +
                '</label>' +
                '<label class="checkbox-inline">' +
                '  <input type="checkbox" name="myBookmarksDayCheckBox" id="daySelectorSaturday" value="Sat" ' + days[5] + '>Saturday' +
                '</label>' +
                '<label class="checkbox-inline">' +
                '  <input type="checkbox" name="myBookmarksDayCheckBox" id="daySelectorSunday" value="Sun" ' + days[6] + '>Sunday' +
                '</label>' +
                '<div class="daySelectorButtons">' +
                    '<button type="button" id="daySelButton-Everyday" class="btn btn-primary btn-xs">Everyday</button>' +
                    '<button type="button" id="daySelButton-Weekdays" class="btn btn-primary btn-xs">Weekdays</button>' +
                    '<button type="button" id="daySelButton-Weekends" class="btn btn-primary btn-xs">Weekends</button>' +
                    '<button type="button" id="daySelButton-None" class="btn btn-success btn-xs">None</button>' +
                '</div>' +
                '  <hr class="selectedLinkHR">' +
              '</div>' +
                '' +
        '</div>';
        // '<!-- SINGLE ROW END -->';

    $(appendTo).append(newBookmark);

}

// Work out the days selected by analyzing the checkboxes for each bookmark
function calculateDays( bookmarkRow ) {

    var dayComplete = '';
    var list = [ '#daySelectorMonday', '#daySelectorTuesday', '#daySelectorWednesday',
                '#daySelectorThursday', '#daySelectorFriday', '#daySelectorSaturday', '#daySelectorSunday' ];

    for ( var i = 0; i < list.length; i++ ) {

        var day = list[ i ];

        if (debugDayCalculator) {
            // Example: #daySelectorMonday: true
            console.log(day + ': ' + bookmarkRow.find(day).prop('checked'));
        }

        // Check to see if day is ticked.
        if ( bookmarkRow.find(day).prop('checked') ) {

            //console.log(day + ' is TICKED');
            dayComplete += '1';

        } else {

            //console.log(day + ' is NOT TICKED');
            dayComplete += '0';
        }


    }

    if (debugDayCalculator) {
        console.log('Day complete string is: ' + dayComplete);
        console.log('-------------');
    }

    return dayComplete;

}

// Day Selector Buttons
$( ".selectedLinksGather" ).on("click", "#daySelButton-Everyday", function() {
    daySelectorButton ($(this).parents(), 'Everyday');
});

$( ".selectedLinksGather" ).on("click", "#daySelButton-Weekdays", function() {
    daySelectorButton ($(this).parents(), 'Weekdays');
});

$( ".selectedLinksGather" ).on("click", "#daySelButton-Weekends", function() {
    daySelectorButton ($(this).parents(), 'Weekends');
});

$( ".selectedLinksGather" ).on("click", "#daySelButton-None", function() {
    daySelectorButton ($(this).parents(), 'None');
});

function daySelectorButton (bookmarkRowObject, day) {

    var list = [ '#daySelectorMonday', '#daySelectorTuesday', '#daySelectorWednesday', '#daySelectorThursday',
                 '#daySelectorFriday', '#daySelectorSaturday', '#daySelectorSunday' ];

    switch (day) {
        case 'Everyday':

            for ( var i = 0; i < list.length; i++ ) {

                var individualDay = list[ i ];
                bookmarkRowObject.closest('div#myBookmarksDaySelectorRow.checkbox').find(individualDay).prop({checked : true});

            }

            break;


        case 'Weekdays':

            for ( var i = 0; i < 5; i++ ) {

                var individualDay = list[ i ];
                bookmarkRowObject.closest('div#myBookmarksDaySelectorRow.checkbox').find(individualDay).prop({checked : true});

            }

             for ( var i = 5; i < list.length; i++ ) {

                var individualDay = list[ i ];
                bookmarkRowObject.closest('div#myBookmarksDaySelectorRow.checkbox').find(individualDay).prop({checked : false});

            }

            break;


        case 'Weekends':

            for ( var i = 0; i < 5; i++ ) {

                var individualDay = list[ i ];
                bookmarkRowObject.closest('div#myBookmarksDaySelectorRow.checkbox').find(individualDay).prop({checked : false});

            }

             for ( var i = 5; i < list.length; i++ ) {

                var individualDay = list[ i ];
                bookmarkRowObject.closest('div#myBookmarksDaySelectorRow.checkbox').find(individualDay).prop({checked : true});

            }

            break;


        case 'None':


            for ( var i = 0; i < list.length; i++ ) {

                var individualDay = list[ i ];
                bookmarkRowObject.closest('div#myBookmarksDaySelectorRow.checkbox').find(individualDay).prop({checked : false});

            }

            break;
    }

}

// Get today's day
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

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// 9. Initializing Function
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Get Options
$( document ).ready(function() {

    // Load Options Settings
    loadOptions();

    // Load Selected Bookmarks
    loadBookmarks();

    // Generate Users Bookmarks
    chrome.bookmarks.getTree(function(bookmarkBar) { printBookmarks(bookmarkBar);})

});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// 10. 'In Progress' Functions
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

