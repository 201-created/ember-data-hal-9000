/* jshint node:true */

module.exports = {
  scenarios: [
    {
      name: "default",
      dependencies: {}
    },
    {
      name: "ember-data-beta-19",
      dependencies: {
        "ember": "1.12.1",
        "ember-data": "1.0.0-beta.19.2"
      }
    },
    {
      name: "ember-data-beta-19-with-ember-1-13",
      dependencies: {
        "ember": "1.13.2",
        "ember-data": "1.0.0-beta.19.2"
      }
    }
  ]
};
