
function getFormData(form){
    var unindexed_array = form.serializeArray();
    var indexed_array = {};

    $.map(unindexed_array, function(n, i){
        indexed_array[n['name']] = n['value'];
    });

    return indexed_array;
}

function generate() {
  var form = $("#form");
  var data = getFormData(form);
  var race = $('select[name=race] option').filter(':selected').val()
  data.race = race
  var _class = $('select[name=class] option').filter(':selected').val()
  data.class = _class
  console.log(data);
}
