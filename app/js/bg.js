const XHR = new XMLHttpRequest();
let Tags;
$.getJSON(chrome.extension.getURL('data/tags.json'), tags => {
    Tags = tags;
});
let Arr = [];
for (let e of[chrome.tabs.onUpdated, chrome.tabs.onMoved, chrome.tabs.onSelectionChanged]) {
    e.addListener(() => {
        chrome.runtime.sendMessage({
            'update': 1
        });
    });
}

function inject(tab) {
    let browserAction = chrome.browserAction;
    browserAction.getPopup({
        'tabId': tab.id
    }, result => {
        if (!result) {
            browserAction.setBadgeText({
                'tabId': tab.id,
                'text': '·'
            });
            browserAction.setBadgeBackgroundColor({
                'color': '#c00'
            })
            browserAction.setPopup({
                'tabId': tab.id,
                'popup': 'popup.html'
            });
            for (let key in Tags) {
                createMenus(key);
            }
            chrome.tabs.executeScript(tab.id, {
                'file': 'js/jquery.min.js',
                'runAt': 'document_end'
            }, () => {
                chrome.tabs.executeScript(tab.id, {
                    'file': 'js/collector.js',
                    'runAt': 'document_end'
                });
            });
        }
    });
}
chrome.browserAction.onClicked.addListener(tab => {
    chrome.storage.sync.get('options', options => {
        $.get(options.options.beforeRequest, {
            'url': tab.url
        }, article => {
            if (article.notice) { //check the required key in return json
                let notice = article.notice;
                for (let key in Tags) {
                    if (Tags[key].required && !notice[key]) {
                        inject(tab);
                        return;
                    }
                }
                let str = '';
                for (let key in notice) {
                    str += $("<input/>").attr('name', key).attr('type', 'hidden').val(notice[key]).prop('outerHTML');
                }
                $('<form/>').attr('target', '_blank').attr('method', 'POST').attr('action', options.options.afterRequest).append(str).submit();
                chrome.tabs.reload(tab.id);
            } else {
                inject(tab);
            }
        }).fail(() => {
            inject(tab);
        });
    });
});
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.clear(() => {
        chrome.tabs.create({
            'url': 'options.html'
        });
    });
});

function getSelector(tab) {
    while (Arr.length === 0); {
        let data = Arr.pop();
        if (data.tabId === tab.id && data.windowId === data.windowId && data.tabUrl === data.tabUrl) {
            return data;
        }
    }
}

function restore(key, tab) {
    let selector = getSelector(tab);
    if (selector) {
        selector.tagId = key;
        selector.tagName = Tags[key].name;
        chrome.storage.local.get('selectorList', data => {
            let selectorList = data.selectorList || [];
            selectorList.push(selector);
            chrome.storage.local.set({
                'selectorList': selectorList
            });
        });
        chrome.tabs.sendMessage(tab.id, {
            'addTag': selector
        });
        chrome.runtime.sendMessage({
            'update': 1
        });
    }
}


function createMenus(key) {
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            'title': chrome.i18n.getMessage('markupAs') + Tags[key].name,
            'contexts': ['all'],
            'onclick': (info, tab) => {
                restore(key, tab);
            }
        });
    });
}
chrome.runtime.onMessage.addListener((request, sender) => {
    let tab = sender.tab || request.tab;
    if (request.getData) {
        chrome.storage.local.get('selectorList', data => {
            let currentSelector = [];
            if (data.selectorList) {
                let items = data.selectorList;
                for (let item of items) {
                    if (item.tabUrl === tab.url && item.tabId === tab.id && item.windowId === tab.windowId) {
                        currentSelector.push({
                            "selector": item.selector,
                            "tagName": item.tagName,
                            "tagId": item.tagId
                        });
                    }
                }
            }
            chrome.tabs.sendMessage(tab.id, {
                'currentSelector': currentSelector
            });
        });
    }
    if (request.data) {
        let data = request.data;
        data.tabId = tab.id;
        data.windowId = tab.windowId;
        data.tabUrl = tab.url;
        Arr.push(data);
    }
});
