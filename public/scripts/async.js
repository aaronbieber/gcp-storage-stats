$(function() {
  console.log('ready');

  var last_response_len = false;
  $.ajax('/storage/async', {
    xhrFields: {
      onprogress: function(e)
      {
        var this_response, response = e.currentTarget.response;
        if(last_response_len === false)
        {
          this_response = response;
          last_response_len = response.length;
        }
        else
        {
          this_response = response.substring(last_response_len);
          last_response_len = response.length;
        }
        console.log(this_response);
      }
    }
  })
    .done(function(data)
          {
            console.log('Complete response = ' + data);
          })
    .fail(function(data)
          {
            console.log('Error: ', data);
          });
  console.log('Request Sent');
});
