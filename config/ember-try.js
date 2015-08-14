/* jshint node:true */

module.exports = {
  scenarios: [
    {
      name: "default",
      dependencies: {}
    },
    {
      name: "ember-data-1-13-4",
      dependencies: {
        "ember": "1.13.8",
        "ember-data": "1.13.4"
      }
    },
    {
      name: "ember-data-1-13-9",
      dependencies: {
        "ember": "1.13.8",
        "ember-data": "1.13.9"
      }
    },
    {
      name: "release",
      dependencies: {
        "ember": "components/ember#release",
        "ember-data": "2.0.0-beta.1"
      },
      resolutions: {
        "ember": "release"
      }
    },
    {
      name: "beta",
      dependencies: {
        "ember": "components/ember#beta",
        "ember-data": "2.0.0-beta.2"
      },
      resolutions: {
        "ember": "beta"
      }
    },
    {
      name: "canary",
      dependencies: {
        "ember": "components/ember#canary",
        "ember-data": "2.0.0-beta.2"
      },
      resolutions: {
        "ember": "canary"
      }
    }
  ]
};
