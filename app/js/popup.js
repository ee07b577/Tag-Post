function refresh() {
    chrome.tabs.getSelected(null, function(tab) {
        chrome.storage.local.get('selectorList', function(data) {
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
                $("#btnClear,#btnSubmit").attr("disabled", "disabled");
            }
        });
    });
}

function log(content) {
    chrome.runtime.sendMessage({
        'log': content
    });
}
$(function() {
    refresh();
    $("#btnSubmit").click(function() {
        chrome.tabs.getSelected(null, function(tab) {
            chrome.storage.local.get('selectorList', function(data) {
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
                    chrome.storage.sync.get('options', function(data) {
                        $.post(data.options.request, {
                            'jsonRule': JSON.stringify(obj)
                        }, function(response) {
                            console.log(response);
                            log('manual');
                            log(response);
                            if (response.notice) {
                                var article = response.notice;
                                if (newItems.length > 0) {
                                    chrome.storage.local.set({
                                        'selectorList': newItems
                                    }, function() {
                                        refresh();
                                        chrome.browserAction.setBadgeText({
                                            'tabId': tab.id,
                                            'text': ''
                                        });
                                        chrome.browserAction.setPopup({
                                            'tabId': tab.id,
                                            'popup': ''
                                        });
                                        if (article.title && article.content && article.source) {
                                            var postInfo = {
                                                'article_ContentFrom': article.source,
                                                'article_title': article.title,
                                                'article_content': article.content,
                                                'article_keyword': ''
                                            }
                                            var temp_form = document.createElement("form");
                                            temp_form.action = data.options.afterRequest;
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
                                            log('not enough info.');
                                        }
                                    });
                                } else {
                                    log(article);
                                    chrome.storage.local.clear(function() {
                                        refresh();
                                        chrome.browserAction.setBadgeText({
                                            'tabId': tab.id,
                                            'text': ''
                                        });
                                        chrome.browserAction.setPopup({
                                            'tabId': tab.id,
                                            'popup': ''
                                        });
                                        if (article.title && article.content && article.source) {
                                            var postInfo = {
                                                'article_ContentFrom': article.source,
                                                'article_title': article.title,
                                                'article_content': article.content,
                                                'article_keyword': ''
                                            }
                                            var temp_form = document.createElement("form");
                                            temp_form.action = data.options.afterRequest;
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
                                            var postInfo = {
                                                'article_ContentFrom': currentItems.source,
                                                'article_title': currentItems.title,
                                                'article_content': currentItems.content,
                                                'article_keyword': ''
                                            }
                                            var temp_form = document.createElement("form");
                                            temp_form.action = data.options.afterRequest;
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
                                        }
                                    });
                                }
                            } else {
                                log('rule failed');
                                var postInfo = {
                                    'article_ContentFrom': currentItems.source,
                                    'article_title': currentItems.title,
                                    'article_content': currentItems.content,
                                    'article_keyword': ''
                                }
                                var temp_form = document.createElement("form");
                                temp_form.action = data.options.afterRequest;
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
                            }
                        }, 'json').fail(function() {
                            log('interface response exception.');
                        });
                    });
                }
            });
        });
    });
    $('body').on('click', '.glyphicon-remove', function() {
        var field = $(this).data('tag');
        var selector = $(this).data('selector');
        chrome.tabs.getSelected(null, function(tab) {
            chrome.storage.local.get('selectorList', function(data) {
                if (data.hasOwnProperty('selectorList')) {
                    var items = data.selectorList;
                    for (var i = 0; i < items.length; i++) {
                        var item = items[i];
                        if (item.tabId === tab.id && item.windowId === tab.windowId && item.tabUrl === tab.url && item.field === field && item.selector === selector && item.tabUrl === tab.url) {
                            items.splice(i, 1);
                        }
                    }
                    if (items.length > 0) {
                        chrome.storage.local.set({
                            'selectorList': items
                        }, function() {
                            refresh();
                        });
                    } else {
                        chrome.storage.local.clear(function() {
                            refresh();
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
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.update && request.update === 1) {
        refresh();
    }
});
