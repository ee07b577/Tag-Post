$(function() {
    chrome.storage.sync.get('options', function(data) {
        if (data && data.options) {
            var options = data.options;
            for (var i in options) {
                $(`input[data-option="${i}"]`).val(options[i]);
            }
        }
    });
    $('#btnSave').click(function() {
        var options = {};
        $('input[data-option]').each(function(index, input) {
            options[$(input).data('option')] = $(input).val();
        });
        chrome.storage.sync.set({
            'options': options
        }, function() {
            window.close();
        })
    });
});
