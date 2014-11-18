import DS from "ember-data";

export default DS.RESTSerializer.extend({

  extractSingle: function(store, primaryType, rawPayload, recordId) {
    delete rawPayload._links;

    var storePayload = {};
    storePayload[primaryType.typeKey] = rawPayload;

    return this._super(store, primaryType, storePayload, recordId);
  },

  extractArray: function(store, primaryType, rawPayload) {
    delete rawPayload._links;
    return this._super(store, primaryType, rawPayload._embedded);
  },

  normalize: function(type, hash, property) {
    delete hash._links;
    return this._super(type, hash, property);
  }

});
