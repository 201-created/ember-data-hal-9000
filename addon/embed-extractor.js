import Ember from "ember";

function EmbedExtractor(raw, store){
  this.raw = raw;
  this.store = store;
  this.result = {};
}

EmbedExtractor.prototype.extractArray = function(){
  this.extractEmbedded(this.raw);

  return this.result;
};

EmbedExtractor.prototype.extractSingle = function(typeKey){
  var value = this.extractEmbedded(this.raw);
  this.addValueOfType(value, typeKey); // TODO This can put the primary object last in the sideload result set

  return this.result;
};

EmbedExtractor.prototype.adapterFor = function(type){
  return this.store.adapterFor(type);
};

// Add a value of the given type to the result set.
// This is called when `extractEmbedded` comes across an embedded object
// that should be sideloaded, and when `extractSingle` wants to add its
// primary type to a top-level array.
EmbedExtractor.prototype.addValueOfType = function(value, typeKey) {
  var pathForType = this.store.adapterFor(typeKey).pathForType(typeKey);

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
EmbedExtractor.prototype.extractEmbedded = function(hash){
  var extractor = this;
  var result   = hash;
  var embedded = hash._embedded || {};
  delete result._embedded;

  Ember.keys(embedded).forEach(function(key){
    var value = embedded[key];

    if (Ember.isArray(value)) {
      var embeddedIds = [];

      value.forEach(function(embeddedObject){
        var extracted = extractor.extractEmbedded(embeddedObject);
        var id = extracted.id;
        embeddedIds.push(id);

        extractor.addValueOfType(extracted, key);
      });

      // TODO should be `keyForRelationship` (to determine if it should be, e.g., "modelName_ids")
      result[key] = embeddedIds;

    } else {
      value = extractor.extractEmbedded(value);
      var id = value.id;
      result[key] = id;

      extractor.addValueOfType(value, key);
    }
  });

  return result;
};

export default EmbedExtractor;
