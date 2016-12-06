chrome.runtime.sendMessage({
    'getData': 1
});

function log(info) {
    chrome.runtime.sendMessage({
        'log': info
    });
}
$('body').on('contextmenu', '*', event => {
    log('[content.$.onContextmenu]');
    event.stopPropagation();
    let currentTarget = event.currentTarget;
    let html = $(currentTarget).removeClass('tag-highlight').prop('outerHTML');
    let text = $(currentTarget).text();
    let textSuffix = '';
    let arr = [];
    while (currentTarget && currentTarget.nodeType === 1) {
        let id = currentTarget.id;
        $(currentTarget).removeClass('tag-highlight');
        if ($(currentTarget).hasClass('tag-markup')) {
            $(currentTarget).addClass('tag-conflict');
        }
        let className = currentTarget.className.trim().split(' ').join('.');
        let nth = $(currentTarget.parentNode).children(currentTarget.tagName).index(currentTarget) + 1;
        arr.push((id ? '' : currentTarget.tagName.toLowerCase()) + (id ? "#" + id : (className ? '.' + className : '')) + ((nth > 1 && !id) ? ':nth-of-type(' + nth + ')' : ''));
        currentTarget = currentTarget.parentNode;
    }
    let fullSelector = arr.reverse().join('>').split('#');
    let shortSelector;
    if (fullSelector.length > 1) {
        shortSelector = '#' + fullSelector[fullSelector.length - 1];
    } else {
        shortSelector = arr.reverse().join('>');
    }
    chrome.runtime.sendMessage({
        'data': {
            'selector': shortSelector,
            'html': html,
            'text': text
        }
    });
}).on('mouseover', '*', event => {
    event.preventDefault();
    event.stopPropagation();
    let currentTarget = $(event.currentTarget);
    currentTarget.addClass('tag-highlight');
    if (currentTarget.hasClass('tag-markup')) {
        currentTarget.addClass('tag-conflict');
    }
}).on('mouseout', '*', event => {
    event.preventDefault();
    event.stopPropagation();
    $(event.currentTarget).removeClass('tag-highlight').removeClass('tag-conflict');
});
chrome.runtime.onMessage.addListener(request => {
    log('[content.chrome.runtime.onMessage].addListener');
    log(request);
    if (request.addTag) {
        let tag = request.addTag;
        log(tag);
        $(tag.selector).addClass('tag-markup').attr('data-tagName', tag.tagName).attr('data-tagId', tag.tagId);
    }
    if (request.currentSelector) {
        log(request.currentSelector);
        $('.tag-markup').removeClass('tag-markup');
        for (let item of request.currentSelector) {
            $(item.selector).addClass('tag-markup').attr('data-tag', item.tagName).attr('data-tagId', item.tagId);
        }
    }
});
