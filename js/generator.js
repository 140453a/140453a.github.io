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
  classSkills(char.class, template, char.skills, char.stats);
  classAdjustment(char, char.class, char.skills, char.features, char.stats, template);
  bonusSkills(char, char.class, template);
  combatStyle(char, template);
  // XKCD TODO: remove "COMBAT" from char.skills
  $("#myJson").html("[" + JSON.stringify(char) + "]");
  return true;
}


function combatStyle(char, template) {
  if (["Magic-User"].includes(char.class)) {return} // magic users have no combat ability.
  var inner_style = {}
  var outer_style = [inner_style];

  inner_style.name = char.class + " Style";

  var indexOfCombat = char.skills.findIndex(function(obj, index) {
    if(Object.keys(obj)[0] == 'COMBAT') return true;
  });
  inner_style.value = char.skills[indexOfCombat].COMBAT; // setting combat style percentage.

  // removing COMBAT professional skill from skills
  char.skills.splice(indexOfCombat, 1);

  // setting up starter class weapon.
  char.weapons = [];

  char.combat_styles = outer_style; // setting char with combat style array
}



// add bonus skills with focus on getting 5 prerequisite skills to 50%
function bonusSkills(char, class_ ,template) {
  // have 100 bonus points to try to spend on getting at least 5 skills to 50%, no more than 10 points per skill.
  var points = 100;
  // get list of prerequisite skills
  var prerequisites = template.Class[class_].Prereqs;
  var skills = char.skills;
  var skill_keys = []; // an array of skill names that the character knows.
  for (var i = 0; i < skills.length; i++) {
    skill_keys.push(Object.keys(skills[i])[0]) // extracting skill name from array of skill objects.
  }

  // creating intersection of prerequisites and actual skills. 
  var skill_intersection = skill_keys.filter(v => prerequisites.includes(v)); // array of skills in both char.skills and class prerequisites.
  for (intersects of skill_intersection) {
    var points_to_add = 10;
    var index_of_skill = skills.findIndex(p => Object.keys(p)[0] == intersects);
    skills[index_of_skill][intersects] = skills[index_of_skill][intersects] + points_to_add;
    points -= points_to_add;
  }


  // spending bonus points, there are mathematically at least 20 bonus points remaining (8 prereqs * 10 = 80 - 100 = 20 points.)
  var bonus_intersection = skill_keys.filter(e => !skill_intersection.includes(e));
  var bonusSelector = randomNoRepeats(bonus_intersection);
  var iterations = points / 10; // how many times we are iterating and adding 10 points to a skill.
  for (var i = 0; i < iterations; i++) {
    var random_skill = bonusSelector();
    var index_of_skill = skills.findIndex(p => Object.keys(p)[0] == random_skill);
    var points_to_add = Math.min(5, points);
    skills[index_of_skill][random_skill] = skills[index_of_skill][random_skill] + points_to_add;
  }
  

}



// add class-given languages, passions, and talents/features with associated skill boosts.
function classAdjustment(char, class_, skills, features, stats, template) {
  // for ease of use, characteristics are separated out and put in temp array 's'.
  var STR = Object.entries(stats[0])[0][1];
  var CON = Object.entries(stats[1])[0][1];
  var SIZ = Object.entries(stats[2])[0][1];
  var DEX = Object.entries(stats[3])[0][1];
  var INT = Object.entries(stats[4])[0][1];
  var POW = Object.entries(stats[5])[0][1];
  var CHA = Object.entries(stats[6])[0][1];
  var language_base = INT+CHA;

  // pushing each classes' notes.
  char.notes = template.Class[class_].Notes;

  if (class_ === "BardA") {
    skills.push({"Language (Thieves' Cant": language_base + 40});
    for (talent of template.Class[class_].Talents) { // pushing all talents to character.
      features.push(talent);
    }

    // Strike rank (called initiative, but importer uses strike rank.)
    var pen = template.Class[class_].Armor.Penalty.toString();
    var unmodified_sr = char.attributes.strike_rank;
    var sr = (unmodified_sr - template.Class[class_].Armor.Penalty).toString();
    console.log(sr + `(${unmodified_sr}-${pen})`);
    char.attributes.strike_rank = sr + `(${unmodified_sr}-${pen})`;


  } else if (class_ === "BardD") {
    skills.push({"Language (Druids’ Cant)": language_base + 40});
    for (talent of template.Class[class_].Talents) { // pushing all talents to character.
      features.push(talent);
    }

    // Strike rank (called initiative, but importer uses strike rank.)
    var pen = template.Class[class_].Armor.Penalty.toString();
    var unmodified_sr = char.attributes.strike_rank;
    var sr = (unmodified_sr - template.Class[class_].Armor.Penalty).toString();
    char.attributes.strike_rank = sr + `(${unmodified_sr}-${pen})`;

    // required passions
    skills.push({"Passion (Druidic Oath)": 30 + POW + INT});




  } else if (class_ === "Berserker") {
    // adding 5% to COMBAT and Unarmed skills for Combat Proficiency feature.
    var indexOfCombat = skills.findIndex(function(obj, index) {
      if(Object.keys(obj)[0] == 'COMBAT') return true;
    });
    var indexOfUnarmed = skills.findIndex(function(obj, index) {
      if(Object.keys(obj)[0] == 'Unarmed') return true;
    });
    skills[indexOfUnarmed].Unarmed += 5;
    skills[indexOfCombat].COMBAT += 5;

     // Strike rank (called initiative, but importer uses strike rank.)
     var pen = template.Class[class_].Armor.Penalty.toString();
     var unmodified_sr = char.attributes.strike_rank;
     var sr = (unmodified_sr - template.Class[class_].Armor.Penalty).toString();
     char.attributes.strike_rank = sr + `(${unmodified_sr}-${pen})`;

    for (talent of template.Class[class_].Talents) { // pushing all talents to character.
      features.push(talent);
    }

    // required passions
    skills.push({"Passion (Fear of Magic)": 30 + POW + POW});




  } else if (class_ === "Cavalier") {
    // adding 5% to COMBAT and Unarmed skills for Combat Proficiency feature.
    var indexOfCombat = skills.findIndex(function(obj, index) {
      if(Object.keys(obj)[0] == 'COMBAT') return true;
    });
    var indexOfUnarmed = skills.findIndex(function(obj, index) {
      if(Object.keys(obj)[0] == 'Unarmed') return true;
    });
    skills[indexOfUnarmed].Unarmed += 5;
    skills[indexOfCombat].COMBAT += 5;


    // Strike rank (called initiative, but importer uses strike rank.) armor proficiency handled in json.
    var pen = template.Class[class_].Armor.Penalty.toString();
    var unmodified_sr = char.attributes.strike_rank;
    var sr = (unmodified_sr - template.Class[class_].Armor.Penalty).toString();
    char.attributes.strike_rank = sr + `(${unmodified_sr}-${pen})`;


    for (talent of template.Class[class_].Talents) { // pushing all talents to character.
      features.push(talent);
    } // pushing all talents to character.

    // required passions
    skills.push({"Passion (Oath of Fealty)": 30 + POW + INT});
    skills.push({"Passion (Knightly Virtues)": 30 + POW + INT});





  } else if (class_ === "Cleric") {
    for (talent of template.Class[class_].Talents) { // pushing all talents to character.
      features.push(talent);
    }

    // Strike rank (called initiative, but importer uses strike rank.)
    var pen = template.Class[class_].Armor.Penalty.toString();
    var unmodified_sr = char.attributes.strike_rank;
    var sr = (unmodified_sr - template.Class[class_].Armor.Penalty).toString();
    char.attributes.strike_rank = sr + `(${unmodified_sr}-${pen})`;


    // required passions
    skills.push({"Passion (Clerical Oath)": 30 + POW + POW});





  } else if (class_ === "Druid") {
    skills.push({"Language (Druids’ Cant)": language_base + 40});
    for (talent of template.Class[class_].Talents) { // pushing all talents to character.
      features.push(talent);
    }

    // Strike rank (called initiative, but importer uses strike rank.)
    var pen = template.Class[class_].Armor.Penalty.toString();
    var unmodified_sr = char.attributes.strike_rank;
    var sr = (unmodified_sr - template.Class[class_].Armor.Penalty).toString();
    char.attributes.strike_rank = sr + `(${unmodified_sr}-${pen})`;

    // required passions
    skills.push({"Passion (Druidic Oath)": 30 + POW + INT});




  } else if (class_ === "Fighter") {
    features.push(template.Class[class_].Talents[2]); // combat proficiency, add 5% to COMBAT and Unarmed
    // adding 5% to COMBAT and Unarmed skills.
    var indexOfCombat = skills.findIndex(function(obj, index) {
      if(Object.keys(obj)[0] == 'COMBAT') return true;
    });
    var indexOfUnarmed = skills.findIndex(function(obj, index) {
      if(Object.keys(obj)[0] == 'Unarmed') return true;
    });
    skills[indexOfUnarmed].Unarmed += 5;
    skills[indexOfCombat].COMBAT += 5;

    var armor_penalty = template.Class[class_].Armor.Penalty;
    // pick 1 defensive style from Armour prof, Agile defender
    // additionally, pick 1 out of 3 combat styles, total of 6 permuations
    var fighter_style = Math.floor(Math.random() * 6) + 1; // 1 - 6 
    switch(fighter_style) { // pick a permutation at random.
      case 1:
        features.push(template.Class[class_].Talents[0]); // defense talent, armour proficiency.
        features.push(template.Class[class_].Talents[3]); // offense talent, melee weapon.
        armor_penalty = Math.ceil(armor_penalty / 4); // armour proficiency lowers enc.
        break;
      case 2:
        features.push(template.Class[class_].Talents[0]); // defense talent, armour proficiency.
        features.push(template.Class[class_].Talents[4]); // offense talent, ranged weapon.
        armor_penalty = Math.ceil(armor_penalty / 4); // armour proficiency lowers enc.
        break;
      case 3:
        features.push(template.Class[class_].Talents[0]); // defense talent, armour proficiency.
        features.push(template.Class[class_].Talents[5]); // offense talent, shields.
        armor_penalty = Math.ceil(armor_penalty / 4); // armour proficiency lowers enc.
        break;
      case 4:
        features.push(template.Class[class_].Talents[1]); // defense talent, agile defender.
        features.push(template.Class[class_].Talents[3]); // offense talent, melee weapon.
        break;
      case 5:
        features.push(template.Class[class_].Talents[1]); // defense talent, agile defender.
        features.push(template.Class[class_].Talents[4]); // offense talent, ranged weapon.
        break;
      case 6:
        features.push(template.Class[class_].Talents[1]); // defense talent, agile defender.
        features.push(template.Class[class_].Talents[5]); // offense talent, shields.
        break;
    }

    // Strike rank (called initiative, but importer uses strike rank.)
    var pen = armor_penalty.toString();
    var unmodified_sr = char.attributes.strike_rank;
    var sr = (unmodified_sr - armor_penalty).toString();
    char.attributes.strike_rank = sr + `(${unmodified_sr}-${pen})`;


  } else if (class_ === "Magic-User") {
    for (talent of template.Class[class_].Talents) { // pushing all talents to character.
      features.push(talent);
    }
    //determining speciality, if any.
    var specialization = null;
    var magic_chance = Math.round(Math.random()); // 50% chance to be specialized.
    if (magic_chance) { // if specialized,
      features_arr = [] // populate with specialization information, as well as a feature telling you your specialization, and forbidden specs.
      var random_spec = Math.floor(Math.random() * 8); // 1 - 8
      switch (random_spec) {
        case 1:
          specialization = "Abjuration";
          break;
        case 2:
          specialization = "Conjuration";
          break;      
        case 3:
          specialization = "Divination";
          break;
        case 4:
          specialization = "Enchantment";
          break;
        case 5:
          specialization = "Illusion";
          break;
        case 6:
          specialization = "Evocation";
          break;      
        case 7:
          specialization = "Necromancy";
          break;
        case 8:
          specialization = "Alteration";
          break;    
        default:
          break;
      }
    }

    // Strike rank (called initiative, but importer uses strike rank.)
    var pen = template.Class[class_].Armor.Penalty.toString();
    var unmodified_sr = char.attributes.strike_rank;
    var sr = (unmodified_sr - template.Class[class_].Armor.Penalty).toString();
    char.attributes.strike_rank = sr + `(${unmodified_sr}-${pen})`;



  } else if (class_ === "Monk") {
    // adding 5% to COMBAT and Unarmed skills for Combat Proficiency feature.
    var indexOfCombat = skills.findIndex(function(obj, index) {
      if(Object.keys(obj)[0] == 'COMBAT') return true;
    });
    var indexOfUnarmed = skills.findIndex(function(obj, index) {
      if(Object.keys(obj)[0] == 'Unarmed') return true;
    });
    skills[indexOfUnarmed].Unarmed += 5;
    skills[indexOfCombat].COMBAT += 5;

    for (talent of template.Class[class_].Talents) { // pushing all talents to character.
      features.push(talent);
    }

    // required passions
    skills.push({"Passion (Self-Improvement)": 30 + POW + INT});
    skills.push({"Passion (Oath to Monastic Order)": 30 + POW + INT});

    // Strike rank (called initiative, but importer uses strike rank.)
    var pen = template.Class[class_].Armor.Penalty.toString();
    var unmodified_sr = char.attributes.strike_rank;
    var sr = (unmodified_sr - template.Class[class_].Armor.Penalty).toString();
    char.attributes.strike_rank = sr + `(${unmodified_sr}-${pen})`;


  } else if (class_ === "Paladin") {
    // adding 5% to COMBAT and Unarmed skills for Combat Proficiency feature.
    var indexOfCombat = skills.findIndex(function(obj, index) {
      if(Object.keys(obj)[0] == 'COMBAT') return true;
    });
    var indexOfUnarmed = skills.findIndex(function(obj, index) {
      if(Object.keys(obj)[0] == 'Unarmed') return true;
    });
    skills[indexOfUnarmed].Unarmed += 5;
    skills[indexOfCombat].COMBAT += 5;

    for (talent of template.Class[class_].Talents) { // pushing all talents to character.
      features.push(talent);
    }

    // required passions
    skills.push({"Passion (Holy Order of Paladins)": 30 + POW + INT});

    // Strike rank (called initiative, but importer uses strike rank.) armor prof handled in json.
    var pen = template.Class[class_].Armor.Penalty.toString();
    var unmodified_sr = char.attributes.strike_rank;
    var sr = (unmodified_sr - template.Class[class_].Armor.Penalty).toString();
    char.attributes.strike_rank = sr + `(${unmodified_sr}-${pen})`;


  } else if (class_ === "Ranger") {
    features.push(template.Class[class_].Talents[1]); // combat proficiency, add 5% to COMBAT and Unarmed
    // adding 5% to COMBAT and Unarmed skills.
    var indexOfCombat = skills.findIndex(function(obj, index) {
      if(Object.keys(obj)[0] == 'COMBAT') return true;
    });
    var indexOfUnarmed = skills.findIndex(function(obj, index) {
      if(Object.keys(obj)[0] == 'Unarmed') return true;
    });
    skills[indexOfUnarmed].Unarmed += 5;
    skills[indexOfCombat].COMBAT += 5;

    // pushing static features
    features.push(template.Class[class_].Talents[0]);
    features.push(template.Class[class_].Talents[4]);
    var ranger_style = Math.round(Math.random()); // 0 or 1
    if (ranger_style == 0) { // bow specialization
      features.push(template.Class[class_].Talents[2]);  
    } else { // dual wielding specialization
      features.push(template.Class[class_].Talents[3]);
    }

    // required passions
    skills.push({"Passion (Ranger Oath)": 30 + POW + POW});


    // Strike rank (called initiative, but importer uses strike rank.)
    var pen = template.Class[class_].Armor.Penalty.toString();
    var unmodified_sr = char.attributes.strike_rank;
    var sr = (unmodified_sr - template.Class[class_].Armor.Penalty).toString();
    char.attributes.strike_rank = sr + `(${unmodified_sr}-${pen})`;


  } else if (class_ === "Thief") {
    skills.push({"Language (Thieves' Cant": language_base + 40});
    for (talent of template.Class[class_].Talents) { // pushing all talents to character.
      features.push(talent);
    }

    // required passions
    skills.push({"Passion (Thieve's Guild Oath)": 30 + POW + INT});
      
    // Strike rank (called initiative, but importer uses strike rank.)
    var pen = template.Class[class_].Armor.Penalty.toString();
    var unmodified_sr = char.attributes.strike_rank;
    var sr = (unmodified_sr - template.Class[class_].Armor.Penalty).toString();
    char.attributes.strike_rank = sr + `(${unmodified_sr}-${pen})`;

  } else if (class_ === "Thief-Acrobat") {
    skills.push({"Language (Thieves' Cant": language_base + 40});
    for (talent of template.Class[class_].Talents) { // pushing all talents to character.
      features.push(talent);
    }
    // Strike rank (called initiative, but importer uses strike rank.)
    var pen = template.Class[class_].Armor.Penalty.toString();
    var unmodified_sr = char.attributes.strike_rank;
    var sr = (unmodified_sr - template.Class[class_].Armor.Penalty).toString();
    char.attributes.strike_rank = sr + `(${unmodified_sr}-${pen})`;

    // required passions
    skills.push({"Passion (Thieve's Guild Oath)": 30 + POW + INT});
  }
}



function classSkills(class_, template, skills, stats){
  // for ease of use, characteristics are separated out and put in temp array 's'.
  var STR = Object.entries(stats[0])[0][1];
  var CON = Object.entries(stats[1])[0][1];
  var SIZ = Object.entries(stats[2])[0][1];
  var DEX = Object.entries(stats[3])[0][1];
  var INT = Object.entries(stats[4])[0][1];
  var POW = Object.entries(stats[5])[0][1];
  var CHA = Object.entries(stats[6])[0][1];
  var s = {"STR": STR, "CON": CON, "SIZ": SIZ, "DEX": DEX, "INT": INT, "POW": POW, "CHA": CHA}

  var class_choices = template.Class[class_].Skills.Professional;

  // Remove choices that you already have picked in racial skills!
  var skill_keys = []; // an array of skill names that the character knows.
  for (var i = 0; i < skills.length; i++) {
    skill_keys.push(Object.keys(skills[i])[0]) // extracting skill name from array of skill objects.
  }
  var class_choices = class_choices.filter(e => !skill_keys.includes(e)); // stops duplicating of professional skills that are already picked when race skills were picked.


  var class_professionals = [];
  class_professionals.push(class_choices[0], class_choices[1]);

    // make random choices of indexes 2+ and push to class_professionals.
    class_choices = class_choices.slice(2); // remove first 2 choices.

  const randomElement = class_choices[Math.floor(Math.random() * class_choices.length)];
  class_professionals.push(randomElement);
  console.log("Class_Professionals", class_professionals);
  // adding pro skills to char.skills
  for (let i = 0; i < 3; i ++) {
    if(skills.indexOf(class_professionals[i]) === -1){ // only pushing if unique.
      var template_value = template.Skills.Professional[class_professionals[i]];
      var skill_split = template_value.split("+");
      var skill_value = s[skill_split[0]] + s[skill_split[1]];
      skills.push({[class_professionals[i]]: skill_value});
    }
  }


  //assigning 100 points to class skills, no minimum, 15 point maximum
  var points = 100;
  var class_prereqs = template.Class[class_].Prereqs;
  var class_prereqs_std = template.Class[class_].Skills.Standard;

  // combined pro and standard skills to create an intersection to determine skill priority.
  var combined_prereqs = Array.from(new Set(class_prereqs_std.concat(class_professionals)));
  // creating intersection
  var skill_intersection = class_prereqs.filter(v => combined_prereqs.includes(v)); // array of skills in both available class skills, and class requirements
  for (intersects of skill_intersection) {
    var points_to_add = Math.min(15, points); // for the case of adding 15 to 7 skills (15 * 7 = 105), makes the last skill only add 10 points.
    var index_of_skill = skills.findIndex(p => Object.keys(p)[0] == intersects);
    skills[index_of_skill][intersects] = skills[index_of_skill][intersects] + points_to_add;
    points -= points_to_add;
    if (points <= 0) break; //
  }

  var skill_chooser = randomNoRepeats(combined_prereqs);
  while (points > 0) { // have left over points to spend that are inconsequential to class prereqs.
    var random_skill = skill_chooser();
    if (skill_intersection.includes(random_skill)) continue; // already had 15 added to it.
    var index_of_skill = skills.findIndex(p => Object.keys(p)[0] == random_skill);
    var points_to_add = Math.min(5, points);
    skills[index_of_skill][random_skill] = skills[index_of_skill][random_skill] + points_to_add;
    points -= points_to_add;
  }
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

  var class_prereqs = template.Class[_class].Prereqs;
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
    points -= 10;
  }
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
          stats[i][stat] = parseInt(prereq[characteristic]);
        }
      }
    }
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

  // Strike rank (called initiative, but importer uses strike rank. This is further modified in bonus stage.)
  var unmodified_sr = Math.ceil((INT + DEX)/2);

  attr.strike_rank = unmodified_sr;

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
