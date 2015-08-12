/* jshint node:true */

module.exports = {
  scenarios: [
    {
      name: "default",
      dependencies: {}
    },
    {
      name: "release",
      dependencies: {
        "ember": "components/ember#release",
        "ember-data": "components/ember-data#release"
      },
      resolutions: {
        "ember": "release",
        "ember-data": "release"
      }
    },
    {
      name: "beta",
      dependencies: {
        "ember": "components/ember#beta",
        "ember-data": "components/ember-data#beta",
      },
      resolutions: {
        "ember": "beta",
        "ember-data": "beta"
      }
    },
    {
      name: "canary",
      dependencies: {
        "ember": "components/ember#canary",
        "ember-data": "components/ember-data#canary",
      },
      resolutions: {
        "ember": "canary",
        "ember-data": "canary"
      }
    }
  ]
};
