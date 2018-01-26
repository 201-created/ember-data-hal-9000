import HalSerializer from "ember-data-hal-9000/serializer";
import Ember from 'ember';

export default HalSerializer.extend({
  // example attrs from http://emberjs.com/api/data/classes/DS.JSONAPISerializer.html#property_attrs
  attrs: {
    admin: 'is_admin',
    occupation: { key: 'career' }
  },

  keyForRelationship(key) {
    return Ember.String.underscore(key);
  }
});
