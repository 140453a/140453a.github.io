// Checking form data for validity.
function checkData(data) {
  if (data.name === '') {
    console.log("Error: name field is blank.");
    return false;
  }
  return true;
}

// Retrieving form data and putting in json.
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
  var err = checkData(data);
  if (!err) return false;
  var race = $('select[name=race] option').filter(':selected').val();
  data.race = race;
  var _class = $('select[name=class] option').filter(':selected').val();
  data.class = _class;
  console.log(data);
  return true;
}
