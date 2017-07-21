$(function() {
  var sendSMS = 0,
      last_response_len = false;

  if (window.location.toString().match(/sendSMS=1/)) {
    sendSMS = 1;
  }
  $.ajax('/storage/files', {
    data: { sendSMS: sendSMS },
    dataType: 'json'
  })
    .done((data) => {
      console.log('Complete response = ' + data);
      $.get('/templates/_storage_table.mustache',
            function(template) {
              var rendered = Mustache.render(template, data);
              $('#js-data').html(rendered);
            });
    })
    .fail((data) => {
      console.log('Error: ', data);
    });
  console.log('Request sent');
});
