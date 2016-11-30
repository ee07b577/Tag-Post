$(function () {
    $('*[data-i18n]').each(function () {
        console.log($(this).data('i18n'));
        $(this).text(chrome.i18n.getMessage($(this).data('i18n')));
    });
});