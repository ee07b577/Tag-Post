$(function() {
    chrome.storage.sync.get('options', function(data) {
        var options = data.options;
        if (options) {
            for (var j in options) {
                $('input[data-option="' + j + '"]').val(options[j]);
            }
        }
    });
    $('#btnSave').click(function() {
        var options = {};
        $('input[data-option]').each(function(index, input) {
            var key = $(input).data('option');
            var val = $(input).val();
            options[key] = val;
        });
        chrome.storage.sync.set({
            'options': options
        }, function() {
            log('option saved.');
        })
    });
});
