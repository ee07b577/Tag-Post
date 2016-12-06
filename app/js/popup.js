function render() {
    log(`[popup.render]`);
    chrome.tabs.getSelected(null, tab => {
        log(`[chrome.tabs.getSelected]`);
        chrome.storage.local.get('selectorList', data => {
            log(`[chrome.storage.local.get]:selectorList`);
            log(data);
            if (data.selectorList) {
                log(data.selectorList);
                let items = data.selectorList;
                $('.list-group').html('');
                for (let i = 0; i < items.length; i++) {
                    let item = items[i];
                    if (item.tabId === tab.id && item.windowId === tab.windowId && item.tabUrl === tab.url) {
                        let field = chrome.i18n.getMessage(item.field);
                        let selector = item.selector;
                        $('.list-group').append($('<li class="list-group-item"><div class="input-group input-group-sm"><span class="input-group-btn lblInfo"><button class="btn btn-info" disabled="disabled">' + field + '</button></span><input type="text" class="form-control" value="' + selector + '"><span class="input-group-btn btnDel"><button class="btn btn-danger"><span class="glyphicon glyphicon-remove" data-selector="' + selector + '" data-tag="' + item.field + '"></span></button></span></div></li>'));
                    }
                }
            } else {
                log(`!data.selectorList`);
                $("#lstItems").hide();
                $("#btnSubmit").attr("disabled", "disabled");
            }
        });
    });
}

function log(info) {
    chrome.runtime.sendMessage({
        'log': info
    });
}

function postContent(data, action, tab) {
    log(`[popup.postContent]`);
    let str = "";
    for (let key in data) {
        str += $("<input/>").attr('name', key).attr('type', 'hidden').val(data[key]).prop('outerHTML');
    }
    $('form').attr('action', action).append(str).submit();
    chrome.tabs.reload(tab.id);
}
$(() => {
    log(`[popup.$]`);
    render();
    $("#btnSubmit").click(() => {
        log(`[$.btnSubmit.click]`);
        chrome.tabs.getSelected(null, tab => {
            log(`[chrome.tabs.getSelected]`);
            chrome.storage.local.get('selectorList', data => {
                log(`[chrome.storage.local.get]:selectorList`);
                log(data);
                if (data.selectorList) {
                    log(data.selectorList);
                    let items = data.selectorList;
                    let newItems = [];
                    let obj = {
                        'url': tab.url,
                        'items': []
                    };
                    let currentItems = {};
                    for (let i = 0; i < items.length; i++) {
                        let item = items[i];
                        if (item.tabId === tab.id && item.windowId === tab.windowId && item.tabUrl === tab.url) {
                            obj.items.push({
                                'tag': item.field,
                                'selector': item.selector
                            });
                            currentItems[item.field] = item.html;
                        } else {
                            newItems.push(item);
                        }
                    }
                    chrome.storage.sync.get('options', options => {
                        log(`[chrome.storage.sync.get]`);
                        log(options);
                        $.post(options.options.request, {
                            'jsonRule': JSON.stringify(obj)
                        }, response => {
                            log(`[$.post]`);
                            log(response);
                            if (response.notice) {
                                log(response.notice);
                                let article = response.notice;
                                if (newItems.length > 0) {
                                    chrome.storage.local.set({
                                        'selectorList': newItems
                                    }, () => {
                                        log(`[chrome.storage.local.set]`);
                                        if (article.title && article.content && article.source) {
                                            postContent({
                                                'article_ContentFrom': article.source,
                                                'article_title': article.title,
                                                'article_content': article.content,
                                                'article_keyword': ''
                                            }, options.options.afterRequest, tab);
                                        } else {
                                            postContent({
                                                'article_ContentFrom': currentItems.source,
                                                'article_title': currentItems.title,
                                                'article_content': currentItems.content,
                                                'article_keyword': ''
                                            }, options.options.afterRequest, tab);
                                        }
                                    });
                                } else {
                                    chrome.storage.local.clear(() => {
                                        log(`[chrome.storage.local.clear]`);
                                        if (article.title && article.content && article.source) {
                                            postContent({
                                                'article_ContentFrom': article.source,
                                                'article_title': article.title,
                                                'article_content': article.content,
                                                'article_keyword': ''
                                            }, options.options.afterRequest, tab);
                                        } else {
                                            postContent({
                                                'article_ContentFrom': currentItems.source,
                                                'article_title': currentItems.title,
                                                'article_content': currentItems.content,
                                                'article_keyword': ''
                                            }, options.options.afterRequest, tab);
                                        }
                                    });
                                }
                            } else {
                                postContent({
                                    'article_ContentFrom': currentItems.source,
                                    'article_title': currentItems.title,
                                    'article_content': currentItems.content,
                                    'article_keyword': ''
                                }, options.options.afterRequest, tab);
                            }
                        }, 'json').fail(() => {
                            log(`[$.post]:fail`);
                            postContent({
                                'article_ContentFrom': currentItems.source,
                                'article_title': currentItems.title,
                                'article_content': currentItems.content,
                                'article_keyword': ''
                            }, options.options.afterRequest, tab);
                        });
                    });
                }
            });
        });
    });
    $('body').on('click', '.glyphicon-remove', () => {
        log('[popup.$.click]');
        let field = $(this).data('tag');
        let selector = $(this).data('selector');
        chrome.tabs.getSelected(null, tab => {
            log('[chrome.tabs.getSelected]');
            chrome.storage.local.get('selectorList', data => {
                log('[chrome.storage.local.get]:selectorList');
                log(data);
                if (data.selectorList) {
                    log(data.selectorList);
                    let items = data.selectorList;
                    for (let i = 0; i < items.length; i++) {
                        let item = items[i];
                        if (item.tabId === tab.id && item.windowId === tab.windowId && item.tabUrl === tab.url && item.field === field && item.selector === selector && item.tabUrl === tab.url) {
                            items.splice(i, 1);
                        }
                    }
                    render();
                    if (items.length > 0) {
                        chrome.storage.local.set({
                            'selectorList': items
                        });
                    } else {
                        chrome.storage.local.clear(() => {
                            window.close();
                        })
                    }
                    chrome.runtime.sendMessage({
                        'getData': 1,
                        'tab': tab
                    });
                }
            });
        });
    });
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            log(`[popup.chrome.runtime.onMessage.addListener]`);
            if (request.update) {
                log(request.update `);
        render();
    }
});
