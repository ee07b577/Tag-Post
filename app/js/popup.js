function render() {
    chrome.tabs.getSelected(null, tab => {
        chrome.storage.local.get('selectorList', data => {
            if (data.hasOwnProperty('selectorList')) {
                var items = data.selectorList;
                $('.list-group').html('');
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    if (item.tabId === tab.id && item.windowId === tab.windowId && item.tabUrl === tab.url) {
                        var field = chrome.i18n.getMessage(item.field);
                        var selector = item.selector;
                        $('.list-group').append($('<li class="list-group-item"><div class="input-group input-group-sm"><span class="input-group-btn lblInfo"><button class="btn btn-info" disabled="disabled">' + field + '</button></span><input type="text" class="form-control" value="' + selector + '"><span class="input-group-btn btnDel"><button class="btn btn-danger"><span class="glyphicon glyphicon-remove" data-selector="' + selector + '" data-tag="' + item.field + '"></span></button></span></div></li>'));
                    }
                }
            } else {
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
    log(`[popup][postContent]`);
    log(data);
    log(action);
    log(tab);
    let str = "";
    for (let key in data) {
        log(data[key]);
        str += $("<input/>").attr('name', key).attr('type', 'hidden').val(data[key]).prop('outerHTML');
    }
    log(str);
    $('form').attr('action', action).append(str).submit();
    chrome.tabs.reload(tab.id);
}
$(function () {
    render();
    $("#btnSubmit").click(() => {
        chrome.tabs.getSelected(null, tab => {
            log(`[popup][submit][tabs.getSelected]`);
            log(tab);
            chrome.storage.local.get('selectorList', data => {
                log(`[popup][submit][storage.local.get]:data`);
                log(data);
                if (data.hasOwnProperty('selectorList')) {
                    var items = data.selectorList;
                    var newItems = [];
                    var obj = {
                        'url': tab.url,
                        'items': []
                    };
                    var currentItems = {};
                    for (var i = 0; i < items.length; i++) {
                        var item = items[i];
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
                    log(`[popup][submit][storage.local.get]:obj`);
                    log(obj);
                    log(`[popup][submit][storage.local.get]:newItems`);
                    log(newItems);
                    chrome.storage.sync.get('options', options => {
                        log(`[popup][submit][storage.local.get][storage.sync.get]:options`);
                        log(options);
                        $.post(options.options.request, {
                            'jsonRule': JSON.stringify(obj)
                        }, response => {
                            log(`[popup][submit][storage.local.get][storage.local.get][post]:response`);
                            log(response);
                            if (response.notice) {
                                var article = response.notice;
                                if (newItems.length > 0) {
                                    chrome.storage.local.set({
                                        'selectorList': newItems
                                    }, () => {
                                        log(`[popup][submit][storage.local.get][storage.local.get][post][storage.local.set]`);
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
                                        log(`[popup][submit][storage.local.get][storage.local.get][post][storage.local.clear]`);
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
                            log(`[popup][submit][storage.local.get][storage.local.get][post]:fail`);
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
        var field = $(this).data('tag');
        var selector = $(this).data('selector');
        chrome.tabs.getSelected(null, tab => {
            chrome.storage.local.get('selectorList', data => {
                if (data.hasOwnProperty('selectorList')) {
                    var items = data.selectorList;
                    for (var i = 0; i < items.length; i++) {
                        var item = items[i];
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
    if (request.update && request.update === 1) {
        render();
    }
});;;;;;
