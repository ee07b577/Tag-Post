'use strict';
var fields = ['title', 'source', 'content'];
var arr = [];
chrome.browserAction.setBadgeText({
    'text': ''
});
chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.storage.sync.get('options', function(options) {
        $.get(options.options.beforeRequest, {
            'url': tab.url
        }).done(function(article) {
            try {
                if (article.title && article.content && article.source) {
                    var postInfo = {
                        'article_ContentFrom': article.source,
                        'article_title': article.title,
                        'article_content': article.content,
                        'article_keyword': ''
                    }
                    var temp_form = document.createElement("form");
                    temp_form.action = options.options.afterRequest;
                    temp_form.target = "_blank";
                    temp_form.method = "post";
                    for (var x in postInfo) {
                        var opt = document.createElement("input");
                        opt.name = x;
                        opt.value = postInfo[x];
                        temp_form.appendChild(opt);
                    }
                    document.body.appendChild(temp_form);
                    temp_form.submit();
                } else {
                    throw new Error('not enough info');
                }
            } catch (e) {
                console.log(e);
                chrome.browserAction.getPopup({
                    'tabId': tab.id
                }, function(result) {
                    if (!result) {
                        chrome.browserAction.setBadgeText({
                            'tabId': tab.id,
                            'text': '·'
                        });
                        chrome.browserAction.setBadgeBackgroundColor({
                            'color': '#c00'
                        })
                        chrome.browserAction.setPopup({
                            'tabId': tab.id,
                            'popup': 'popup.html'
                        });
                        for (var i = 0; i < fields.length; i++) {
                            var field = fields[i];
                            createMenus(field);
                        }
                        chrome.tabs.executeScript(tab.id, {
                            'file': 'js/collector.js',
                            'runAt': 'document_end'
                        });
                    }
                });
            }
        }).fail(function() {
            chrome.browserAction.getPopup({
                'tabId': tab.id
            }, function(result) {
                if (!result) {
                    chrome.browserAction.setBadgeText({
                        'tabId': tab.id,
                        'text': '·'
                    });
                    chrome.browserAction.setBadgeBackgroundColor({
                        'color': '#c00'
                    })
                    chrome.browserAction.setPopup({
                        'tabId': tab.id,
                        'popup': 'popup.html'
                    });
                    for (var i = 0; i < fields.length; i++) {
                        createMenus(fields[i]);
                    }
                    chrome.tabs.executeScript(tab.id, {
                        'file': 'js/collector.js',
                        'runAt': 'document_end'
                    });
                }
            });
        });
    });
});
chrome.runtime.onInstalled.addListener(function() {
    chrome.tabs.create({
        'url': 'options.html'
    });
});

function getSelector(tab) {
    if (arr.length > 0) {
        do {
            var data = arr.pop();
            if (data.tabId === tab.id && data.windowId === data.windowId && data.tabUrl === data.tabUrl) {
                return data;
            }
        } while (arr.length === 0);
    }
}

function restore(field, tab) {
    var info = getSelector(tab);
    if (info) {
        info.field = field;
        chrome.storage.local.get('selectorList', function(data) {
            if (data.hasOwnProperty('selectorList')) {
                data.selectorList.push(info);
                chrome.storage.local.set({
                    'selectorList': data.selectorList
                });
            } else {
                chrome.storage.local.set({
                    'selectorList': [info]
                });
            }
        });
        chrome.tabs.sendMessage(tab.id, {
            'addTag': info.selector,
            'tagName': info.field
        });
        chrome.runtime.sendMessage({
            'update': 1
        });
    }
}

var events = {
    "updated": chrome.tabs.onUpdated,
    "moved": chrome.tabs.onMoved,
    "selectionChanged": chrome.tabs.onSelectionChanged
};
for (var i in events) {
    events[i].addListener(function(tabId) {
        chrome.runtime.sendMessage({
            'update': 1
        });
    });
}

function createMenus(field) {
    chrome.contextMenus.removeAll(function() {
        chrome.contextMenus.create({
            'title': chrome.i18n.getMessage('markupAs') + chrome.i18n.getMessage(field),
            'contexts': ['all'],
            'onclick': function(info, tab) {
                restore(field, tab);
            }
        });
    });
}
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    var tab = sender.tab || request.tab;
    if (request.options) {
        var options = request.options;
        if (typeof(options) === 'boolean') {
            console.log('get');
            getOption(sendResponse);
        }
        if (options instanceof Array) {
            setOption(options, sendResponse);
        }
    }
    if (request.log) {
        console.log(request.log);
    }
    if (request.getData) {
        chrome.storage.local.get('selectorList', function(data) {
            if (data.hasOwnProperty('selectorList')) {
                var items = data.selectorList;
                var currentSelector = [];
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    if (item.tabUrl === tab.url && item.tabId === tab.id && item.windowId === tab.windowId) {
                        currentSelector.push({
                            "selector": item.selector,
                            "tag": item.field,
                            "html": item.html
                        });
                    }
                }
                chrome.tabs.sendMessage(tab.id, {
                    'currentSelector': currentSelector
                });
            } else {
                chrome.tabs.sendMessage(tab.id, {
                    'currentSelector': []
                });
            }
        });
    }
    if (request.data) {
        var data = request.data;
        data.tabId = tab.id;
        data.windowId = tab.windowId;
        data.tabUrl = tab.url;
        arr.push(data);
    }
});
