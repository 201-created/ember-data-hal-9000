/* jshint node:true */

module.exports = {
  scenarios: [
    {
      name: "default",
      dependencies: {}
    },
    {
      name: "ember-data-1-13-ember-release",
      dependencies: {
        "ember": "components/ember#release",
        "ember-data": "1.13.4"
      }
    },
    {
      name: "ember-data-1-13-ember-beta",
      dependencies: {
        "ember": "components/ember#beta",
        "ember-data": "1.13.4"
      }
    },
    {
      name: "ember-data-1-13-ember-canary",
      dependencies: {
        "ember": "components/ember#canary",
        "ember-data": "1.13.4"
      }
    },
  ]
};
