const XHR = new XMLHttpRequest();
let Tags;
XHR.onreadystatechange = () => {
    console.info('[background.XHR.onreadystatechange]');
    if (XHR.readyState === 4) {
        console.log(XHR.readyState);
        Tags = JSON.parse(XHR.responseText);
    }
};
XHR.open("GET", chrome.extension.getURL('data/tags.json'), true);
XHR.send();
let Arr = [];
for (let e of[chrome.tabs.onUpdated, chrome.tabs.onMoved, chrome.tabs.onSelectionChanged]) {
    e.addListener(() => {
        console.info(`[background.chrome.tabs.on?.addListener]`);
        chrome.runtime.sendMessage({
            'update': 1
        });
    });
}

function inject(tab) {
    console.log(`[background.inject]`);
    let browserAction = chrome.browserAction;
    browserAction.getPopup({
        'tabId': tab.id
    }, result => {
        console.log(`[chrome.browserAction.getPopup]`);
        if (!result) {
            console.log(`!popup`);
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
    console.log('%c[background.chrome.browserAction.onClicked.addListener]', 'color:orange');
    chrome.storage.sync.get('options', options => {
        console.log('[chrome.storage.sync.get]');
        console.log(options);
        $.get(options.options.beforeRequest, {
            'url': tab.url
        }).done(article => {
            console.log('[$.get]:done');
            console.log(article);
            for (let key in Tags) {
                let tag = Tags[key];
                if (tag.required && !article[key]) {
                    console.log(key);
                    inject(tab);
                    return;
                }
            }
            let str = '';
            for (let key in article) {
                let tag = Tags[key];
                str += $("<input/>").attr('name', key).attr('type', 'hidden').val(article[key]).prop('outerHTML');
            }
            console.log(str);
            $('body').append($('<form/>').attr('target', '_blank').attr('method', 'POST').attr('action', options.options.afterRequest).append(str).submit());
            chrome.tabs.reload(tab.id);
        }).fail(() => {
            console.log('[$.get]:fail');
            inject(tab);
        });
    });
});
chrome.runtime.onInstalled.addListener(() => {
    console.log(`%c[background.chrome.runtime.onInstalled.addListener]`, 'color:orange');
    chrome.storage.local.clear(() => {
        console.log('[chrome.storage.local.clear]');
        chrome.tabs.create({
            'url': 'options.html'
        });
    });
});

function getSelector(tab) {
    console.log('[background.getSelector]');
    while (Arr.length === 0); {
        let data = Arr.pop();
        if (data.tabId === tab.id && data.windowId === data.windowId && data.tabUrl === data.tabUrl) {
            return data;
        }
    }
}

function restore(key, tab) {
    console.log(`[background.restore]`);
    let selector = getSelector(tab);
    if (selector) {
        console.log(selector);
        selector.tagId = key;
        selector.tagName = Tags[key].name;
        chrome.storage.local.get('selectorList', data => {
            console.log(`[chrome.storage.local.get]:selectorList`);
            console.log(data);
            let selectorList = data.selectorList || [];
            selectorList.push(selector);
            chrome.storage.local.set({
                'selectorList': selectorList
            }, xxx => {
                console.log('[chrome.storage.local.set]:selectorList');
                console.log(xxx);
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
    console.log(`[background.createMenus]`);
    chrome.contextMenus.removeAll(() => {
        console.log('[chrome.contextMenus.removeAll]');
        chrome.contextMenus.create({
            'title': chrome.i18n.getMessage('markupAs') + Tags[key].name,
            'contexts': ['all'],
            'onclick': (info, tab) => {
                console.log(`%c[onclick]`, 'color:orange');
                restore(key, tab);
            }
        });
    });
}
chrome.runtime.onMessage.addListener((request, sender) => {
    let tab = sender.tab || request.tab;
    if (request.log) {
        console.log(request.log);
    }
    if (request.getData) {
        console.log('getData');
        console.log(request.getData);
        chrome.storage.local.get('selectorList', data => {
            console.log('[chrome.storage.local.get]:selectorList');
            console.log(data);
            let currentSelector = [];
            if (data.selectorList) {
                console.log(data.selectorList);
                let items = data.selectorList;
                for (let item of items) {
                    if (item.tabUrl === tab.url && item.tabId === tab.id && item.windowId === tab.windowId) {
                        currentSelector.push({
                            "selector": item.selector,
                            "tagName": item.tagName,
                            "tagId": item.tagId,
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
        console.log('data');
        console.log(request.data);
        let data = request.data;
        data.tabId = tab.id;
        data.windowId = tab.windowId;
        data.tabUrl = tab.url;
        Arr.push(data);
    }
});
