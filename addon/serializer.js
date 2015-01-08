import DS from "ember-data";
import Ember from 'ember';
import EmbedExtractor from "./embed-extractor";

export default DS.ActiveModelSerializer.extend({
  serializeIntoHash: function(hash, type, record, options){
    var serialized = this.serialize(record, options);
    Ember.keys(serialized).forEach(function(key){
      hash[key] = serialized[key];
    });
  },

  extractSingle: function(store, primaryType, rawPayload, recordId) {
    var extracted = new EmbedExtractor(rawPayload).
      extractSingle(primaryType.typeKey);

    return this._super(store, primaryType, extracted, recordId);
  },

  extractArray: function(store, primaryType, rawPayload) {
    var extracted = new EmbedExtractor(rawPayload).extractArray();

    return this._super(store, primaryType, extracted);
  },

  normalizePayload: function(payload){
    // top-level _links (such as 'self') can be ignored
    if (payload._links) {
      delete payload._links;
    }
    return this._super(payload);
  },

  normalize: function(type, hash, property) {
    var links = hash._links || {};
    delete hash._links;

    hash.links = hash.links || {};
    delete hash.links.self;

    Ember.keys(links).forEach(function(link){
      if (link === 'self') { return; }

      // Do not include a link for a property that already
      // exists on the hash, because Ember-Data will fetch that
      // resource by the link instead of using the included data
      if (!hash[link]) {
        hash.links[link] = links[link].href;
      }
    });

    return this._super(type, hash, property);
  }

});
