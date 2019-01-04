import DS from 'ember-data';
import { computed } from '@ember/object';

export default DS.JSONAPIAdapter.extend({
  headers: computed(function() {
    return {
      'Content-Type': 'application/hal+json'
    };
  })
});
