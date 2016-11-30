chrome.runtime.sendMessage({
    'getData': 1
});

function log(content) {
    chrome.runtime.sendMessage({
        'log': content
    });
}
$('body').on('contextmenu', '*', function(event) {
    event.stopPropagation();
    var currentTarget = event.currentTarget;
    var html = $(currentTarget).html();
    var textSuffix = '';
    var arr = [];
    while (currentTarget && currentTarget.nodeType === 1) {
        var id = currentTarget.id;
        $(currentTarget).removeClass('tag-highlight');
        if ($(currentTarget).hasClass('tag-markup')) {
            $(currentTarget).addClass('tag-conflict');
        }
        var className = currentTarget.className.trim().split(' ').join('.');
        var nth = $(currentTarget.parentNode).children(currentTarget.tagName).index(currentTarget) + 1;
        arr.push((id ? '' : currentTarget.tagName.toLowerCase()) + (id ? "#" + id : (className ? '.' + className : '')) + ((nth > 1 && !id) ? ':nth-of-type(' + nth + ')' : ''));
        currentTarget = currentTarget.parentNode;
    }
    var fullSelector = arr.reverse().join('>').split('#');
    var shortSelector;
    if (fullSelector.length > 1) {
        shortSelector = '#' + fullSelector[fullSelector.length - 1];
    } else {
        shortSelector = arr.reverse().join('>');
    }
    chrome.runtime.sendMessage({
        'data': {
            'selector': shortSelector,
            'html': html
        }
    });
    log(shortSelector + textSuffix);
}).on('mouseover', '*', function(event) {
    event.preventDefault();
    event.stopPropagation();
    var currentTarget = $(event.currentTarget);
    currentTarget.addClass('tag-highlight');
    if (currentTarget.hasClass('tag-markup')) {
        currentTarget.addClass('tag-conflict');
    }
}).on('mouseout', '*', function(event) {
    event.preventDefault();
    event.stopPropagation();
    $(event.currentTarget).removeClass('tag-highlight').removeClass('tag-conflict');
});
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.addTag) {
        $(request.addTag).addClass('tag-markup').attr('data-field', chrome.i18n.getMessage(request.tagName));
    } else if (request.currentSelector) {
        $('*').removeClass('tag-markup');
        var items = request.currentSelector;
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var selector = item.selector;
            var tag = item.tag;
            var html = item.html;
            $(selector).addClass('tag-markup').attr('data-field', chrome.i18n.getMessage(tag));
        }
    }
});
