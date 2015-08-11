import HalSerializer from "ember-data-hal-9000/serializer";
import Ember from 'ember';

export default HalSerializer.extend({
  keyForRelationship(key) {
    return Ember.String.underscore(key);
  }
});
