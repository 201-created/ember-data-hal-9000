import DS from "ember-data";
import Ember from 'ember';
import EmbedExtractor from "./embed-extractor";

// requestType values that indicate that we are loading a collection, not
// a single resource
var findManyRequestTypes = ["findMany", "findAll", "findHasMany", "findQuery"];

// Reserved keys, per the HAL spec
var halReservedKeys = ['_embedded', '_links'];

var reservedKeys = halReservedKeys.concat(['meta']);

function extractLinksIntoMeta(payload, meta){
  var links = payload._links;
  if (links) {
    meta.links = {};

    Ember.keys(links).forEach(function(key){
      meta.links[key] = links[key].href;
    });
  }

  return meta;
}

export default DS.ActiveModelSerializer.extend({
  serializeIntoHash: function(hash, type, record, options){
    var serialized = this.serialize(record, options);
    Ember.keys(serialized).forEach(function(key){
      hash[key] = serialized[key];
    });
  },

  /*
   `__requestType` is used to know if we are
   dealing with a list resource (i.e., GET /users) which may
   have meta data in the root of the payload, i.e.:
   {
     page: 1,                // <-- metadata
     total_pages: 5,         // <-- metadata
     _embedded: {
       users: [{...}, ...]
     }
   }

   If the requestType is for a single resource we cannot determine
   which properties are metadata and which are part of the payload
   for that resource because they are all at the root level of the payload,
   so punt on that here -- per-model serializers can override extractMeta
   if they need to.

   @return {Object} The payload, modified to remove metadata
  */
  extractMeta: function(store, type, payload){
    var requestType = this.__requestType;

    if ( findManyRequestTypes.indexOf(requestType) > -1 ) {
      var meta = {};

      Ember.keys(payload).forEach(function(key){
        if (reservedKeys.indexOf(key) > -1) { return; }

        meta[key] = payload[key];
        delete payload[key];
      });

      meta = extractLinksIntoMeta(payload, meta);

      store.metaForType(type, meta);
    }

    this._super(store, type, payload);

    return payload;
  },

  /*
   * Override `extract` so we can store the requestType for extractMeta
   */
  extract: function(store, type, payload, id, requestType) {
    this.__requestType = requestType; // used by `extractMeta`

    return this._super(store, type, payload, id, requestType);
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
