function generate() {
    // Loading json template for character generation (e.g. template.Skills.Regular.Athletics)
    const template = JSON.parse(wh); //wf is the json object in Whitehack.json
    generateName(template);
    return true;
  };

function generateName(template) {
    var first = // pick random first name
}