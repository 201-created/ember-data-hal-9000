/* jshint node:true */

module.exports = {
  scenarios: [
    {
      name: "default",
      dependencies: {}
    },
    {
      name: "ember-release",
      dependencies: {
        "ember": "components/ember#release"
      },
      resolutions: {
        'ember': 'release'
      }
    },
    {
      name: "ember-beta",
      dependencies: {
        "ember": "components/ember#beta"
      },
      resolutions: {
        'ember': 'beta'
      }
    },
    {
      name: "ember-canary",
      dependencies: {
        "ember": "components/ember#canary"
      },
      resolutions: {
        'ember': 'canary'
      }
    },
    {
      name: "ember-data-beta-15",
      dependencies: {
        "ember-data": "1.0.0-beta.15"
      }
    },
    {
      name: "ember-data-beta-16.1",
      dependencies: {
        "ember-data": "1.0.0-beta.16.1"
      }
    },
    {
      name: "ember-data-beta-18",
      dependencies: {
        "ember-data": "1.0.0-beta.18"
      }
    }
  ]
};
