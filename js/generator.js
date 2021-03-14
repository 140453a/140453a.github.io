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
  const char = getFormData(form);
  var err = checkData(char);
  if (!err) return false;
  var race = $('select[name=race] option').filter(':selected').val();
  char.race = race;
  const _class = $('select[name=class] option').filter(':selected').val();
  char.class = _class;
  // console.log(char.race);
  // console.log(char.class);
  // Loading json template for character generation (e.g. template.Skills.Regular.Athletics)
  const template = JSON.parse(cf); //cf is the json object in classicfantasy.json
  prereq = template.Class[_class].Prereq;
  var stats = rollCharacteristics(prereq, template, char.race); // getting characteristics for character
  char.stats = stats; // main json now has characteristics that meet prereqs for class.
  var attrs = calculateAttributes(template, char.race, char.stats, char.class);
  char.attributes = attrs;
  // extra stuff needed for json importer to work. (maybe? some needed, some not.)
  char.theism_spells = [];
  char.cult_rank = "None";
  char.mysticism_spells = [];

  char.spirits = [];
  char.combat_styles = []
  char.cults = [];
  char.folk_spells = [];
  var skills = calculateBaseSkills(template, char.stats);
  char.skills = skills;
  char.notes = ""
  char.sorcery_spells = [];
  var hit = hitLocations(template.Class[_class].Armor.Main, template.Class[_class].Armor.Limbs, char.stats);
  char.hit_locations = hit;
  var spec = racialSpecials(template, char.race);
  char.features = spec;
  racialSkills(char.skills, template, race, char.stats, char.class);
  $("#myJson").html("[" + JSON.stringify(char) + "]");
  return true;
}

function racialSkills(skills, template, race, stats, _class) {
  // for ease of use, characteristics are separated out and put in temp array 's'.
  var STR = Object.entries(stats[0])[0][1];
  var CON = Object.entries(stats[1])[0][1];
  var SIZ = Object.entries(stats[2])[0][1];
  var DEX = Object.entries(stats[3])[0][1];
  var INT = Object.entries(stats[4])[0][1];
  var POW = Object.entries(stats[5])[0][1];
  var CHA = Object.entries(stats[6])[0][1];
  var s = {"STR": STR, "CON": CON, "SIZ": SIZ, "DEX": DEX, "INT": INT, "POW": POW, "CHA": CHA}

  // pushing racial language to skills, if race is demi-human.
  var language_base = INT+CHA;
  var langs = template.Race[race].Skills.Languages;
  for (language in langs){
      skills.push({[language]: language_base + langs[language]}); //adding 40 to language skill.
  }
  // adding 40 to all race's Customs skill.
  var indexOfCustoms = skills.findIndex(function(obj, index) {
    if(Object.keys(obj)[0] == 'Customs') return true;
  });
  skills[indexOfCustoms].Customs = skills[indexOfCustoms].Customs + 40;

  // Selecting 3 professional skills from racial list, setting to base values + 5
  var chooser = randomNoRepeats(template.Race[race].Skills.Professional);
  var race_prereqs_pro = [];
  for (let i = 0; i < 3; i ++) {
    var pro_skill = chooser();
    var template_value = template.Skills.Professional[pro_skill];
    var skill_split = template_value.split("+");
    var skill_value = s[skill_split[0]] + s[skill_split[1]];
    // add 5 to each skill.
    skill_value = skill_value + 5;
    skills.push({[pro_skill]: skill_value});
    race_prereqs_pro.push(pro_skill);
  }


  // Putting 5 points in every racial standard skill.
  var points = 85;
  for (var s_skill of template.Race[race].Skills.Standard) {
    var index_of_skill = skills.findIndex(p => Object.keys(p)[0] == s_skill); // xkcd
    skills[index_of_skill][s_skill] = skills[index_of_skill][s_skill] + 5;
  }
  points = points - (template.Race[race].Skills.Standard.length * 5);
  //now have 50 points

  // spending rest of points on professional+ standard skills. no more than 15 per skill.

  var class_prereqs = template.Class[_class].Skills;
  var race_prereqs_std = template.Race[race].Skills.Standard;
  var race_prereqs = Array.from(new Set(race_prereqs_std.concat(race_prereqs_pro)));
  // checking if any of my skills match class prerequisite skills.
  var skill_intersection = class_prereqs.filter(v => race_prereqs.includes(v)); // array of skills in both class requirements, and racial available skills.
  for (intersects of skill_intersection) {
    var index_of_skill = skills.findIndex(p => Object.keys(p)[0] == intersects);
    skills[index_of_skill][intersects] = skills[index_of_skill][intersects] + 10;
    points -= 10;
    if (points <= 0) break;
  }
  // need to find symmetric difference of arrays to not go over 15 skill limit accidentally.
  var skill_chooser = randomNoRepeats(race_prereqs);
  while (points > 0) { // have left over points to spend that are inconsequential to class prereqs.
    var random_skill = skill_chooser();
    if (skill_intersection.includes(random_skill)) continue; // already had 15 added to it.
    var index_of_skill = skills.findIndex(p => Object.keys(p)[0] == random_skill);
    skills[index_of_skill][random_skill] = skills[index_of_skill][random_skill] + 10;
    console.log(random_skill);
    points -= 10;
  }
  console.log(skill_intersection);
  console.log(points);
}

// takes elements out randomly with no repeats until none are left, then resets.
function randomNoRepeats(array) {
  var copy = array.slice(0);
  return function() {
    if (copy.length < 1) { copy = array.slice(0); }
    var index = Math.floor(Math.random() * copy.length);
    var item = copy[index];
    copy.splice(index, 1);
    return item;
  };
}

function racialSpecials(template, race) {
  var spec = []
  for (var special of template.Race[race].Special) {
    spec.push(special);
  }
  return spec;
}

function calculateBaseSkills(template, stats) {
  // for ease of use, characteristics are separated out and put in temp array 's'.
  var STR = Object.entries(stats[0])[0][1];
  var CON = Object.entries(stats[1])[0][1];
  var SIZ = Object.entries(stats[2])[0][1];
  var DEX = Object.entries(stats[3])[0][1];
  var INT = Object.entries(stats[4])[0][1];
  var POW = Object.entries(stats[5])[0][1];
  var CHA = Object.entries(stats[6])[0][1];
  var s = {"STR": STR, "CON": CON, "SIZ": SIZ, "DEX": DEX, "INT": INT, "POW": POW, "CHA": CHA}



  var skill_return = [];
  var skills = template.Skills.Regular;
  for (var skill in skills) {
    var skill_arr = skills[skill].split("+");
    var skill_value = s[skill_arr[0]] + s[skill_arr[1]];
    skill_return.push({[skill]: skill_value});
  }
  return skill_return;
}

function copyText() {
  var copyText = document.getElementById("myJson");
  copyText.select();
  copyText.setSelectionRange(0, 99999);
  document.execCommand("copy");
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
  //console.log(result);
  return result;
}

// returns an array of chracteristics that meet min-reqs for chosen class.
function rollCharacteristics(prereq, template, race) {
  var stats = []
  // Naively setting characteristics to temp array
  stats.push({"STR": roll(template.Race[race].Characteristics.STR)});
  stats.push({"CON": roll(template.Race[race].Characteristics.CON)});
  stats.push({"SIZ": roll(template.Race[race].Characteristics.SIZ)});
  stats.push({"DEX": roll(template.Race[race].Characteristics.DEX)});
  stats.push({"INT": roll(template.Race[race].Characteristics.INT)});
  stats.push({"POW": roll(template.Race[race].Characteristics.POW)});
  stats.push({"CHA": roll(template.Race[race].Characteristics.CHA)});

  // setting characteristics to min-required value if underrolled
  for (let i = 0; i < stats.length; i++) {
    for (var characteristic in prereq) {
      let stat = Object.keys(stats[i])[0]; // this is first key of stat object in stats array
      let statVal = Object.entries(stats[i])[0][1]; // this is the value of ^ key
      if (characteristic === stat){
        if(prereq[characteristic] > statVal) { // if underrolled
          //console.log("CONDITION!!!", stat);
          stats[i][stat] = parseInt(prereq[characteristic]);
        }
        //console.log(characteristic, prereq[characteristic], stat, statVal);
      }
      //console.log(characteristic, prereq[characteristic]);
    }
    //console.log(Object.keys(stats[i]));
  }
  return(stats);
}

function calculateAttributes(template, race, stats, class_) {
  // for ease of use, characteristics are separated out.
  var STR = Object.entries(stats[0])[0][1];
  var CON = Object.entries(stats[1])[0][1];
  var SIZ = Object.entries(stats[2])[0][1];
  var DEX = Object.entries(stats[3])[0][1];
  var INT = Object.entries(stats[4])[0][1];
  var POW = Object.entries(stats[5])[0][1];
  var CHA = Object.entries(stats[6])[0][1];

  // this is the array we return
  var attr = {};
  // mvmnt
  attr.movement = template.Race[race].Attributes.Movement;
  // AP
  if (INT + DEX <= 12) {
    attr.action_points = 1;
  } else if (INT + DEX <= 24) {
    attr.action_points = 2;
  } else if (INT + DEX <= 36) {
    attr.action_points = 3;
  } else {
    attr.action_points = 4;
  }
  // dmod
  var x = STR + SIZ;
  var y = "";
  switch (true) {
    case (x < 6): // 5 or less
      y = "-1d8";
      break;
    case (x < 11):
      y = "-1d6"; // 6 - 10
      break;
    case (x < 16): // 11 - 15
      y = "-1d4";
      break;
    case (x < 21): // 16 - 20
      y = "-1d2";
      break;
    case (x < 26):
      y = "+0";
      break;
    case (x < 31):
      y = "+1d2";
      break;
    case (x < 36):
      y = "+1d4";
      break;
    case (x < 41):
      y = "+1d6";
      break;
    case (x < 46):
      y = "+1d8";
      break;
    case (x < 51):
      y = "+1d10";
      break;
    case (x < 61):
      y = "+1d12";
      break;
    case (x < 71):
      y = "+2d6";
      break;
    case (x < 81):
      y = "+1d8+1d6";
      break;
    default:
      y = "+0";
      break;
  }
  attr.damage_modifier = y;


  // Exp mod xkcd
  if (CHA <= 6) {
    attr.experience_modifier = "-1";
  } else if (CHA > 6 && CHA <= 12) {
    attr.experience_modifier = "0";
  } else if (CHA > 12 && CHA <= 18) {
    attr.experience_modifier = "+1";
  } else {
    attr.experience_modifier = "+2";
  }

  // Strike rank (called initiative, but importer uses strike rank.)
  var pen = template.Class[class_].Armor.Penalty.toString();
  var unmodified_sr = Math.ceil((INT + DEX)/2);
  var sr = (unmodified_sr - template.Class[class_].Armor.Penalty).toString();

  attr.strike_rank = sr + `(${unmodified_sr}-${pen})`;

  // magic points
  attr.magic_points = POW;

  // luck points
  if (POW <= 6) {
    attr.luck_points = "1";
  } else if (POW > 6 && POW <= 12) {
    attr.luck_points = "2";
  } else if (POW > 12 && POW <= 18) {
    attr.luck_points = "3";
  } else {
    attr.luck_points = "4";
  }
  return attr;
}

function hitLocations(chest_abdomen_head, rest_of_body, stats) {
  // these characteristics are needed to calculate HP.
  var CON = Object.entries(stats[1])[0][1];
  var SIZ = Object.entries(stats[2])[0][1];
  var bucket = CON + SIZ;
  var hp_mod = 0
  if (bucket <= 5) {
    hp_mod = 0;
  } else if (bucket <= 10) {
    hp_mod = 1;
  } else if (bucket <= 15) {
    hp_mod = 2;
  } else if (bucket <= 20) {
    hp_mod = 3;
  } else if (bucket <= 25) {
    hp_mod = 4;
  } else if (bucket <= 30) {
    hp_mod = 5;
  } else if (bucket <= 35) {
    hp_mod = 6;
  } else if (bucket <= 40) {
    hp_mod = 7;
  } else {
    hp_mod = 8;
  }
  //returning array
  var hit = [];
  var humanoid = ["Right leg", "Left leg", "Abdomen", "Chest", "Right arm", "Left arm", "Head"];
  var ranges = ["01-03", "04-06", "07-09", "10-12", "13-15", "16-18", "19-20"];
  var special = [2, 3, 6] // indexes of abdomen, chest, head.
  var base_hp = [1, 1, 2, 3, 1, 1, 1]; //starting hp of humanoid, before modifier is added.

  for (var i = 0; i < 7; i++) {
    let obj = {}
    special.includes(i) ? obj.ap = chest_abdomen_head : obj.ap = rest_of_body;
    obj.range = ranges[i];
    obj.hp = base_hp[i] + hp_mod;
    obj.name = humanoid[i];
    hit.push(obj);
  }
  return hit;
}
