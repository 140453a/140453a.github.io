// Disable certain unallowable race/class combinations
$(document).ready(function() {
    //copy the class select, so we can easily reset it
    var classClone = $('#class').clone();
    //Document initialization, required to prevent selecting invalid class/race combinations
    $("#race").val('Dwarf');
    var forbidden = ["Bard", "Cavalier", "Druid", "Magic-User", "Monk", "Paladin", "Ranger"];
    for (let c = 0; c < forbidden.length; c++){
      $('#class').find(`option:contains(${forbidden[c]})`).remove();
    }

    $('#race').change(function() {
        var val = $(this).val();
        //reset the second select on each change
        $('#class').html(classClone.html())
        if (val === 'Dwarf') {
          var forbidden = ["Bard", "Cavalier", "Druid", "Magic-User", "Monk", "Paladin", "Ranger"];
          for (let c = 0; c < forbidden.length; c++){
            $('#class').find(`option:contains(${forbidden[c]})`).remove();
          }
      } else if (val === 'Elf') {
          var forbidden = ["(A)", "Berserker", "Monk", "Paladin"];
          for (let c = 0; c < forbidden.length; c++){
            $('#class').find(`option:contains(${forbidden[c]})`).remove();
          }
      } else if (val === 'Gnome') {
          var forbidden = ["Bard", "Druid", "Cavalier", "Ranger", "Berserker", "Monk", "Paladin"];
          for (let c = 0; c < forbidden.length; c++){
            $('#class').find(`option:contains(${forbidden[c]})`).remove();
          }
      } else if (val === 'Half-Elf') {
          var forbidden = ["Berserker", "Monk", "Paladin"];
          for (let c = 0; c < forbidden.length; c++){
            $('#class').find(`option:contains(${forbidden[c]})`).remove();
          }
      } else if (val === 'Half-Orc') {
          var forbidden = ["Bard", "Cavalier", "Druid", "Magic-User", "Monk", "Paladin", "Ranger"];
          for (let c = 0; c < forbidden.length; c++){
            $('#class').find(`option:contains(${forbidden[c]})`).remove();
          }
      } else if (val === 'Halfling') {
          var forbidden = ["Bard", "Berserker", "Cavalier", "Druid", "Magic-User", "Monk", "Paladin", "Ranger"];
          for (let c = 0; c < forbidden.length; c++){
            $('#class').find(`option:contains(${forbidden[c]})`).remove();
          }
      } else if (val === 'HumanC') {
          var forbidden = ["Berserker"];
          for (let c = 0; c < forbidden.length; c++){
            $('#class').find(`option:contains(${forbidden[c]})`).remove();
          }
      } else if (val === 'HumanB') {
          var forbidden = ["(A)", "Cavalier", "Magic-User", "Monk", "Paladin", "Thief-Acrobat"];
          for (let c = 0; c < forbidden.length; c++){
            $('#class').find(`option:contains(${forbidden[c]})`).remove();
          }
      } else if (val === 'HumanN') {
          var forbidden = ["(A)", "Berserker", "Cavalier", "Druid", "Thief-Acrobat", "Monk", "Paladin"];
          for (let c = 0; c < forbidden.length; c++){
            $('#class').find(`option:contains(${forbidden[c]})`).remove();
          }
      } else if (val === 'HumanP') {
          var forbidden = ["(A)", "Cavalier", "Thief-Acrobat", "Monk", "Paladin", "Magic-User", "Ranger"];
          for (let c = 0; c < forbidden.length; c++){
            $('#class').find(`option:contains(${forbidden[c]})`).remove();
          }
      }
  });
});

// Checking name for validity.
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
  // console.log(char.race);
  // console.log(char.class);
  // Loading json template for character generation (e.g. template.Skills.Regular.Athletics)
  var template = JSON.parse(cf); //cf is the json object in classicfantasy.json
  // Finding race characteristics
  var stats = []
  prereq = template.Class[_class];
  console.log(prereq);
  stats.push({"STR": roll(template.Race[race].Characteristics.STR)});
  stats.push({"CON": roll(template.Race[race].Characteristics.CON)});
  stats.push({"SIZ": roll(template.Race[race].Characteristics.SIZ)});
  stats.push({"DEX": roll(template.Race[race].Characteristics.DEX)});
  stats.push({"INT": roll(template.Race[race].Characteristics.INT)});
  stats.push({"POW": roll(template.Race[race].Characteristics.POW)});
  stats.push({"CHA": roll(template.Race[race].Characteristics.CHA)});
  char.stats = stats;


  console.log(char);
  return true;
}

function roll(dice) {
  var result = 0;
  var mod = 0;
  var rolls = dice.split("d")[0]; // in 3d6+4, rolls is 3
  if (dice.includes("+")) {
    var sides = dice.split("d")[1].split("+")[0]; // in 3d6+4, sides is 6
    mod = parseInt(dice.split("+")[1], 10); // in 3d6+4, mod is 4
  } else {
    var sides = dice.split("d")[1]
  }
  for (var i = 0; i < rolls; i++) {
    result = result + Math.floor(Math.random() * sides) + 1;
  }
  result = result + mod;
  console.log(result);
  return result;
}
