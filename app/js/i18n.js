$(() => {
    $('*[data-i18n]').each(() => {
        $(this).text(chrome.i18n.getMessage($(this).data('i18n')));
    });
});
