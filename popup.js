// parse json data
function parsePosts(globalPage, tab) {
    var url = tab.url
    var title = tab.title
    var encodedUrl = encodeURIComponent(url)

    $("div#timeout").hide(0);
    var redditPosts = lscache.get(globalPage.POST_STORAGE_KEY + tab.url)
    if (redditPosts != null && redditPosts != []) {
        processPosts(redditPosts, encodedUrl, title)
    } else {
        var promises = globalPage.gUrlToAsyncMap[tab.url]
        redditPosts = []
        if (promises != null) {
            Promise.all(promises).then(values => {
                console.log("values " + JSON.stringify(values))
                values.forEach(function(jsonData) { 
                    redditPosts = redditPosts.concat(jsonData.data.children)
                });
                processPosts(redditPosts, encodedUrl, title)
            });
        }
    }
}

function processPosts(redditPosts, encodedUrl, title) {
    var submitUrl = "https://www.reddit.com/submit?url=" + encodedUrl
    if (redditPosts.length === 0) {
        chrome.tabs.create({
                url: submitUrl
        });
        window.close();
    }
    makeDisplay(redditPosts, encodedUrl, title)
}

function makeDisplay(redditPosts, encodedUrl, title) {
    var date_entry; 
    var resubmitUrl = "https://www.reddit.com/submit?resubmit=true&url=" + encodedUrl;
    redditPosts.sort(comparePosts)
    var permalinks = [];
    for( var i=0; entry = redditPosts[i]; i++) {
            date_entry = new Date(entry.data.created_utc*1000).getTime();
            permalinks[i] = {
                link: entry.data.permalink,
                title: entry.data.title,
                score: entry.data.score+"",
                date: date_entry,
                comments: entry.data.num_comments+"",
                subreddit: entry.data.subreddit,
            };
    }

    // showPosts:
    var maxTitleLength = 30;
    if (title.length > maxTitleLength)
        title = title.substring (0, maxTitleLength) + "...";
    $("#data").append("<span id='title'>"+title+"</span>&nbsp;&nbsp;&nbsp;");
    
    $("#data").append("<span><a title='Post to reddit'"+
        " target='_blank' href='" + resubmitUrl + 
        "'>Repost</a></span>");
    
    $.each(permalinks, function(index, permalink) {
		url = "https://www.reddit.com" + permalink.link
        $("#links").append(
            "<li>"+ 
            "<div class='score'>"+permalink.score+"</div>"+
            " <a href='" + url + "' title='" + permalink.link + "' target='_blank' >"+
              permalink.title + "</a>"+
            "<div class='age'>" + timeSince(permalink.date) +
             " ago,&nbsp;&nbsp;" + permalink.comments + " comments,"+
             "&nbsp;&nbsp;r/" + permalink.subreddit +
            "</div>"+
            "</li>"
        );
    });
}

function comparePosts(postA, postB) {
    return postB.data.score - postA.data.score
}

// https://stackoverflow.com/a/3177838
function timeSince(date) {
    var seconds = Math.floor((new Date() - date) / 1000);
    var interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
        return interval + " years";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + " months";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + " days";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " hours";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " minutes";
    }
    return Math.floor(seconds) + " seconds";
}
       
document.addEventListener('DOMContentLoaded',function () {
    $("#close").click(function() {
      window.close();
    });
});

chrome.runtime.getBackgroundPage(function (global) {
    chrome.tabs.getSelected(null, function(tab){
        isBlacklisted(tab,
            function(input) {
                $("div#blacklisted").show(0)
                $("div#timeout").hide(0);
            },
            function (input) {
                $("div#blacklisted").hide(0)
                parsePosts(global, tab)
            });
    });
});

