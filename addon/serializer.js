import DS from "ember-data";
import Ember from 'ember';

export default DS.ActiveModelSerializer.extend({
  serializeIntoHash: function(hash, type, record, options){
    var serialized = this.serialize(record, options);
    Ember.keys(serialized).forEach(function(key){
      hash[key] = serialized[key];
    });
  },

  extractSingle: function(store, primaryType, rawPayload, recordId) {
    var storePayload = {};
    storePayload[primaryType.typeKey] = rawPayload;

    return this._super(store, primaryType, storePayload, recordId);
  },

  extractArray: function(store, primaryType, rawPayload) {
    delete rawPayload._links;
    return this._super(store, primaryType, rawPayload._embedded);
  },

  normalize: function(type, hash, property) {
    var links = hash._links || {};
    delete hash._links;

    hash.links = hash.links || {};

    Ember.keys(links).forEach(function(link){
      if (link === 'self') { return; }

      hash.links[link] = links[link].href;
    });

    return this._super(type, hash, property);
  }

});
