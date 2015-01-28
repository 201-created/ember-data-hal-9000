import Ember from "ember";

function EmbedExtractor(raw, store, primarySerializer){
  this.raw = raw;
  this.store = store;
  this.result = {};
  this.serializer = primarySerializer;
}

EmbedExtractor.prototype.extractArray = function(primaryType){
  this.extractEmbedded(this.raw, primaryType, this.serializer);

  return this.result;
};

// type is a DS.Model
EmbedExtractor.prototype.extractSingle = function(type){
  var value = this.extractEmbedded(this.raw, type, this.serializer);
  this.addValueOfType(value, type); // TODO This can put the primary object last in the sideload result set, that might be bad

  return this.result;
};

EmbedExtractor.prototype.pathForType = function(type){
  var model = this.modelFor(type);
  return this.store.adapterFor(model).pathForType(model.typeKey);
};

// Add a value of the given type to the result set.
// This is called when `extractEmbedded` comes across an embedded object
// that should be sideloaded, and when `extractSingle` wants to add its
// primary type to a top-level array.
EmbedExtractor.prototype.addValueOfType = function(value, type) {
  var pathForType = this.store.adapterFor(type).pathForType(type.typeKey);

  if (!this.result[pathForType]) {
    this.result[pathForType] = [];
  }
  this.result[pathForType].push(value);
};

// Loops through _embedded properties, extracting their ids and
// setting values on `hash` to match those ids.
// For instance:
// ```
//   var hash = {id: 1, name:'user', _embedded: { pet: { id: 1, name: 'fido'} } };
// ```
// extractEmbedded will addValueOfType with the pet, and set hash.pet = 1;
//
// Returns the modified hash
EmbedExtractor.prototype.extractEmbedded = function(hash, primaryType, primarySerializer){
  var extractor = this;
  var result   = hash;
  var embedded = hash._embedded || {};
  delete result._embedded;

  var value, id;

  for (var key in embedded) {
    var typeKey = primarySerializer.typeForRoot(key);
    if (!this.store.modelFactoryFor(typeKey)) {
      Ember.warn("Skipping unknown type: " + key);
      continue;
    }
    var type           = this.store.modelFor(typeKey);
    var typeSerializer = this.store.serializerFor(type);

    value = embedded[key];

    if (Ember.isArray(value)) {
      var embeddedIds = [];

      for (var i=0, len=value.length; i < len; i++) {
        var embeddedObject = value[i];
        var extracted = extractor.extractEmbedded(embeddedObject, type, typeSerializer);
        id = extracted.id;
        embeddedIds.push(id);

        extractor.addValueOfType(extracted, type);
      }

      // TODO should be `keyForRelationship` (to determine if it should be, e.g., "modelName_ids")
      result[key] = embeddedIds;

    } else {
      value = extractor.extractEmbedded(value, type, typeSerializer);
      id = value.id; // TODO ember data provides a way of overriding the id property, right?
      result[key] = id;

      extractor.addValueOfType(value, type);
    }
  }

  return result;
};

export default EmbedExtractor;
