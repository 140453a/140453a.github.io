

// Checking form data for validity.
function checkData(data) {
  if (data.name === '') {
    alert("Error: name field is blank.");
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
  // Validating forms
  var form = $("#form");
  var char = getFormData(form);
  var err = checkData(char);
  if (!err) return false;
  var race = $('select[name=race] option').filter(':selected').val();
  char.race = race;
  var _class = $('select[name=class] option').filter(':selected').val();
  char.class = _class;
  console.log(char.race);
  console.log(char.class)
  // Loading json template for character generation (e.g. template.Skills.Regular.Athletics)
  var template = JSON.parse(cf); //cf is the json object in classicfantasy.json



  return true;
}

function roll(dice) {
  var rolls = dice.split("d")[0]; // in 3d6+4, rolls is 3
  var sides = dice.split("d")[1].split("+")[0]; // in 3d6+4, sides is 6
  var mod = parseInt(dice.split("+")[1], 10); // in 3d6+4, mod is 4
  var result = null;
  for (var i = 0; i < rolls; i++) {
    result = result + Math.floor(Math.random() * sides) + 1;
  }
  result = result + mod;
  console.log(result);
  return result;
}
