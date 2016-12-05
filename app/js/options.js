$(() => {
    let sync = chrome.storage.sync;
    sync.get('options', data => {
        if (data.options) {
            let options = data.options;
            for (let i in options) {
                $(`input[data-option="${i}"]`).val(options[i]);
            }
        }
    });
    $('#btnSave').click(() => {
        let options = {};
        $('input[data-option]').each((index, input) => {
            options[$(input).data('option')] = $(input).val();
        });
        sync.set({
            'options': options
        }, () => {
            window.close();
        });
    });
});
