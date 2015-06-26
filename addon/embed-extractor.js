import Ember from "ember";
import modelNameFromPayloadKey from './compat/model-name-from-payload-key';
import getModelName from './compat/model-name';

function EmbedExtractor(raw, store, primarySerializer){
  this.raw = raw;
  this.store = store;
  this.result = {};
  this.serializer = primarySerializer;
}

EmbedExtractor.prototype.extractArray = function(primaryType){
  // initialize result set with primary type
  this.result[ this.pathForType(primaryType) ] = [];

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
  const modelName = getModelName(type);
  return this.store.adapterFor(modelName).pathForType(modelName);
};

// Add a value of the given type to the result set.
// This is called when `extractEmbedded` comes across an embedded object
// that should be sideloaded, and when `extractSingle` wants to add its
// primary type to a top-level array.
EmbedExtractor.prototype.addValueOfType = function(value, type) {
  const modelName = getModelName(type);
  var pathForType = this.store.adapterFor(modelName).pathForType(modelName);

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

  var value, id, type, modelName, propName;

  for (var key in embedded) {
    type = null;
    modelName = null;
    propName = key;


    modelName = modelNameFromPayloadKey(primarySerializer, key);

    /*jshint loopfunc:true*/
    primaryType.eachRelationship(function(name, relationship){
      var relationshipModelName = modelNameFromPayloadKey(primarySerializer, name);
      if (relationshipModelName === modelName) {
        type = relationship.type;
        propName = relationship.key;
      }
    });

    if (!type) {
      if (!this.store.modelFactoryFor(modelName)) {
        Ember.warn("Skipping unknown type: " + key);
        continue;
      }
      type = this.store.modelFor(modelName);
    }

    if (typeof type === 'string') {
      type = this.store.modelFor(type);
    }

    var typeSerializer = this.store.serializerFor(modelName);

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
      result[propName] = embeddedIds;

    } else {
      value = extractor.extractEmbedded(value, type, typeSerializer);
      // TODO use the serializer's 'primaryKey' property instead
      id = value.id;
      result[propName] = id;

      extractor.addValueOfType(value, type);
    }
  }

  return result;
};

export default EmbedExtractor;
