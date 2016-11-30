$(function() {
    $('*[data-i18n]').each(function() {
        $(this).text(chrome.i18n.getMessage($(this).data('i18n')));
    });
});
