import HalSerializer from "ember-data-hal-9000/serializer";
import Ember from 'ember';

export default HalSerializer.extend({
  attrs: {
    attributes: {serialize: true},
    owner: {serialize: true}
  },

  keyForRelationship(key) {
    return Ember.String.underscore(key);
  }
});
