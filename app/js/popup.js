let Tags;
$.getJSON(chrome.extension.getURL('data/tags.json'), tags => {
    Tags = tags;
});

function render() {
    chrome.tabs.getSelected(null, tab => {
        chrome.storage.local.get('selectorList', data => {
            if (data.selectorList) {
                let items = data.selectorList;
                $('.list-group').html('');
                for (let i = 0; i < items.length; i++) {
                    let item = items[i];
                    if (item.tabId === tab.id && item.windowId === tab.windowId && item.tabUrl === tab.url) {
                        let selector = item.selector;
                        $('.list-group').append($(`<li class="list-group-item"><div class="input-group input-group-sm"><span class="input-group-btn lblInfo"><button class="btn btn-info" disabled="disabled">${item.tagName}</button></span><input type="text" class="form-control" value="${selector}"><span class="input-group-btn btnDel"><button class="btn btn-danger"><span class="glyphicon glyphicon-remove" data-selector="${selector}" data-tagid="${item.tagId}"></span></button></span></div></li>`));
                    }
                }
            } else {
                $("#lstItems").hide();
                $("#btnSubmit").attr("disabled", "disabled");
            }
        });
    });
}

function postContent(data, action, tab) {
    let str = "";
    for (let key in data) {
        str += $("<input/>").attr('name', key).attr('type', 'hidden').val(data[key]).prop('outerHTML');
    }
    $('<form/>').attr('method', 'post').attr('target', '_blank').attr('action', action).append(str).submit();
    chrome.tabs.reload(tab.id);
}
$(() => {
    render();
    $("#btnSubmit").click(() => {
        chrome.tabs.getSelected(null, tab => {
            chrome.storage.local.get('selectorList', data => {
                if (data.selectorList) {
                    let items = data.selectorList;
                    let newItems = [];
                    let obj = {
                        'url': tab.url,
                        'items': []
                    };
                    let currentItems = {};
                    for (let i = 0; i < items.length; i++) {
                        let item = items[i];
                        let tagId = item.tagId;
                        if (item.tabId === tab.id && item.windowId === tab.windowId && item.tabUrl === tab.url) {
                            obj.items.push({
                                'tag': tagId,
                                'selector': item.selector
                            });
                            currentItems[tagId] = Tags[tagId].html ? item.html : item.text;
                        } else {
                            newItems.push(item);
                        }
                    }
                    chrome.storage.sync.get('options', options => {
                        $.post(options.options.request, {
                            'jsonRule': JSON.stringify(obj)
                        }, response => {
                            if (response.notice) {
                                let notice = response.notice;
                                chrome.storage.local.set({
                                    'selectorList': newItems
                                });
                                for (let key in Tags) {
                                    if (Tags[key].required && !notice[key]) {
                                        postContent(currentItems, options.options.afterRequest, tab);
                                        return;
                                    }
                                }
                                postContent(notice, options.options.afterRequest, tab);
                                return;
                            }
                            postContent(currentItems, options.options.afterRequest, tab);
                        }, 'json').fail(() => {
                            postContent(currentItems, options.options.afterRequest, tab);
                        });
                    });
                }
            });
        });
    });
    $('body').on('click', '.glyphicon-remove', () => {
        let tagId = $(this).data('tagid');
        let selector = $(this).data('selector');
        chrome.tabs.getSelected(null, tab => {
            chrome.storage.local.get('selectorList', data => {
                if (data.selectorList) {
                    let items = data.selectorList;
                    for (let i = 0; i < items.length; i++) {
                        let item = items[i];
                        if (item.tabId === tab.id && item.windowId === tab.windowId && item.tabUrl === tab.url && item.tagId === tagId && item.selector === selector && item.tabUrl === tab.url) {
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
    if (request.update) {
        render();
    }
});
