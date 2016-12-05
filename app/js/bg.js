const XHR = new XMLHttpRequest();
let Tags;
XHR.onreadystatechange = () => {
    //console.info('[background.XHR.readyStateChanged]');
    if (XHR.readyState === 4) {
        //console.info('[background.XHR.readyStateChanged]:XHR.readyState==4')
        Tags = JSON.parse(XHR.responseText);
    }
};
XHR.open("GET", chrome.extension.getURL('data/tags.json'), true);
XHR.send();
let Arr = [];
for (let e of[chrome.tabs.onUpdated, chrome.tabs.onMoved, chrome.tabs.onSelectionChanged]) {
    e.addListener(() => {
        //console.warn(`[background.chrome.tabs.on$Event$.addListener]`);
        chrome.runtime.sendMessage({
            'update': 1
        });
    });
}

function inject(tab) {
    console.info(`[background.inject]`);
    let browserAction = chrome.browserAction;
    browserAction.getPopup({
        'tabId': tab.id
    }, result => {
        console.info(`[background.inject.chrome.browserAction.getPopup]`);
        if (!result) {
            console.info(`[background.inject.chrome.browserAction.getPopup]:result`);
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
chrome.browserAction.onClicked.addListener(function (tab) {
    console.warn('[chrome.browserAction.onClicked.addListener]');
    chrome.storage.sync.get('options', function (options) {
        console.info('[chrome.storage.sync.get]:options');
        $.get(options.options.beforeRequest, {
            'url': tab.url
        }).done(article => {
            console.info('[$.get]:beforeRequest:done');
            for (let key in Tags) {
                let tag = Tags[key];
                if (tag.required && !article[key]) {
                    inject(tab);
                    return;
                    break;
                }
            }
            let data = {
                'article_ContentFrom': article.source,
                'article_title': article.title,
                'article_content': article.content,
                'article_keyword': ''
            }
            let str = "";
            for (let key in data) {
                log(data[key]);
                str += $("<input/>").attr('name', key).attr('type', 'hidden').val(data[key]).prop('outerHTML');
            }
            $('form').attr('action', options.options.afterRequest).append(str).submit();
            chrome.tabs.reload(tab.id);
        }).fail(() => {
            inject(tab);
        });
    });
});
chrome.runtime.onInstalled.addListener(() => {
    //console.warn(`[background.chrome.runtime.onInstalled.addListener]`);
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
    console.info(`[background.restore]`);
    var selector = getSelector(tab);
    if (selector) {
        console.info(`[background.restore]:selector`);
        selector.tag = key; //?key?
        chrome.storage.local.get('selectorList', data => {
            console.info(`[background.restore.chrome.storage.local.get]:selectorList`);
            let selectorList = data.selectorList || [];
            selectorList.push(selector);
            chrome.storage.local.set({
                'selectorList': data.selectorList
            });
        });
        chrome.tabs.sendMessage(tab.id, {
            'addTag': selector,
            'tagName': Tags[key].name,
            'tagId': key
        });
        chrome.runtime.sendMessage({
            'update': 1
        });
    }
}


function createMenus(key) {
    console.info(`[background.createMenus]`);
    chrome.contextMenus.removeAll(() => {
        console.info('[background.createMenus.chrome.contextMenus.removeAll]');
        chrome.contextMenus.create({
            'title': chrome.i18n.getMessage('markupAs') + Tags[key].name,
            'contexts': ['all'],
            'onclick': (info, tab) => {
                console.info(`[background.createMenus.chrome.contextMenus.removeAll.chrome.contextMenus.create.onclick]`);
                restore(key, tab);
            }
        });
    });
}
chrome.runtime.onMessage.addListener((request, sender) => {
    //console.warn('[background.chrome.runtime.onMessage.addListener]');
    let tab = sender.tab || request.tab;
    if (request.log) {
        //console.log('[background.chrome.runtime.onMessage.addListener]:log');
        console.log(request.log);
    }
    if (request.getData) {
        console.info('[background.chrome.runtime.onMessage.addListener]:getData');
        chrome.storage.local.get('selectorList', data => {
            console.info('[background][message]:getData[storage.local.get]:selectorList');
            let currentSelector = [];
            if (data.selectorList) {
                let items = data.selectorList;
                for (let item of items) {
                    if (item.tabUrl === tab.url && item.tabId === tab.id && item.windowId === tab.windowId) {
                        currentSelector.push({
                            "selector": item.selector,
                            "tag": item.tag,
                            "html": item.html
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
        console.info('[background.chrome.runtime.onMessage.addListener]:data');
        let data = request.data;
        data.tabId = tab.id;
        data.windowId = tab.windowId;
        data.tabUrl = tab.url;
        Arr.push(data);
    }
});
