import DS from 'ember-data';

/**
 * Converts centigrade in the JSON to fahrenheit in the app
 * @via http://emberjs.com/api/data/classes/DS.Transform.html
 */
export default DS.Transform.extend({
  deserialize: function(serialized) {
    return (serialized *  1.8) + 32;
  },

  serialize: function(deserialized) {
    return (deserialized - 32) / 1.8;
  }
});
