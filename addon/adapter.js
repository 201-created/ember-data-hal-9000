import DS from "ember-data";

export default DS.JSONAPIAdapter.extend({
  headers: {
    'Content-Type': 'application/hal+json'
  }
});
