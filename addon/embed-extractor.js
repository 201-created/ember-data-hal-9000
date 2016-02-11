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
  let primaryTypePath = this.pathForType(primaryType);
  // initialize result set with primary type
  this.result[primaryTypePath] = [];

  this.extractEmbedded(this.raw, primaryType, this.serializer, {
    primaryTypePath: primaryTypePath
  });

  return this.result;
};

// primaryType is a DS.Model
EmbedExtractor.prototype.extractSingle = function(primaryType){
  var value = this.extractEmbedded(this.raw, primaryType, this.serializer, {});
  this.addValueOfType(value, primaryType, {}); // TODO This can put the primary object last in the sideload result set, that might be bad

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
// This ensures that sideloaded objects don't end up in the primary array by
// prefixing them with _ as per the spec:
// https://github.com/emberjs/data/blob/48c02654e8a524b390d1a28975416ee73f912d9e/packages/ember-data/lib/serializers/rest_serializer.js#L401-L408
EmbedExtractor.prototype.addValueOfType = function(value, type, opts) {

  const modelName = getModelName(type);
  var pathForType = this.store.adapterFor(modelName).pathForType(modelName);

  if (opts.forcePrimaryTypeSideload && pathForType === opts.primaryTypePath) {
    pathForType = '_'.concat(pathForType);
  }

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
EmbedExtractor.prototype.extractEmbedded = function(hash, containingType, containingTypeSerializer, opts){
  var extractor = this;
  var result   = hash;
  var embedded = hash._embedded || {};
  delete result._embedded;

  var value, id, embeddedType, modelName, propName;

  for (var key in embedded) {
    embeddedType = null;
    modelName = null;
    propName = key;

    // Look for matching type here

    modelName = modelNameFromPayloadKey(containingTypeSerializer, key);

    /*jshint loopfunc:true*/
    containingType.eachRelationship(function(name, relationship){
      var relationshipModelName = modelNameFromPayloadKey(containingTypeSerializer, name);
      if (relationshipModelName === modelName) {
        embeddedType = relationship.type;
        propName = relationship.key;
      }
    });


    if (!embeddedType) {
      if (!this.store.modelFactoryFor(modelName)) {
        Ember.warn("Skipping unknown embeddedType: " + key);
        continue;
      }
      embeddedType = this.store.modelFor(modelName);
    }

    if (typeof embeddedType === 'string') {
      embeddedType = this.store.modelFor(embeddedType);
    }

    var embeddedTypeSerializer = this.store.serializerFor(modelName);

    var recurseAndSideload = function (o) {
      // When recursing, ensure that anything embedded we find is proprerly interpreted
      // as a sideload.
      return extractor.extractEmbedded(o, embeddedType, embeddedTypeSerializer, {
          primaryTypePath: opts.primaryTypePath,
          forcePrimaryTypeSideload: true
        });
    };

    value = embedded[key];

    if (Ember.isArray(value)) {
      var embeddedIds = [];

      for (var i=0, len=value.length; i < len; i++) {
        var extracted = recurseAndSideload(value[i]);
        id = extracted.id;
        embeddedIds.push(id);

        extractor.addValueOfType(extracted, embeddedType, opts);
      }

      // TODO should be `keyForRelationship` (to determine if it should be, e.g., "modelName_ids")
      result[propName] = embeddedIds;

    } else {
      value = recurseAndSideload(value);
      // TODO use the serializer's 'primaryKey' property instead
      id = value.id;
      result[propName] = id;

      extractor.addValueOfType(value, embeddedType, opts);
    }
  }

  return result;
};

export default EmbedExtractor;
