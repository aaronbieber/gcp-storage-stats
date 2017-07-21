$(function() {
  console.log('ready');

  var last_response_len = false;
  $.ajax('/storage/files', {dataType: 'json'})
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
