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

function setMeta(store, type, meta){
  if (store.setMetadataFor) { // Ember Data after 1.14.1 adds this method
    store.setMetadataFor(type, meta);
  } else {
    store.metaForType(type, meta);
  }
}

export default DS.ActiveModelSerializer.extend({
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

      setMeta(store, type, meta);
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

  /**
   * https://github.com/emberjs/data/blob/48c02654e8a524b390d1a28975416ee73f912d9e/packages/ember-data/lib/serializers/rest_serializer.js#L263
    @method extractSingle
    @param {DS.Store} store
    @param {subclass of DS.Model} primaryType
    @param {Object} payload
    @param {String} recordId
    @return {Object} the primary response to the original request
   */
  extractSingle: function(store, primaryType, rawPayload, recordId) {
    var extracted = new EmbedExtractor(rawPayload, store, this).
      extractSingle(primaryType);

    return this._super(store, primaryType, extracted, recordId);
  },

  /*
   * https://github.com/emberjs/data/blob/48c02654e8a524b390d1a28975416ee73f912d9e/packages/ember-data/lib/serializers/rest_serializer.js#L417
    @method extractArray
    @param {DS.Store} store
    @param {subclass of DS.Model} primaryType
    @param {Object} payload
    @return {Array} The primary array that was returned in response
      to the original query.
  */
  extractArray: function(store, primaryType, rawPayload) {
    var extracted = new EmbedExtractor(rawPayload, store, this).
      extractArray(primaryType);

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

    Ember.keys(links).forEach(function(link){
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
