import Ember from "ember";

function EmbedExtractor(raw){
  this.raw = raw;
  this.sideloads = {};
}

EmbedExtractor.prototype.extractArray = function(){
  var raw = this.raw;

  var result = this.extractEmbedded(raw);

  var extractor = this;

  Ember.keys(extractor.sideloads).forEach(function(key){
    result[key] = extractor.sideloads[key];
  });

  return result;
};

EmbedExtractor.prototype.extractSingle = function(namespace){
  var result = {};
  var extractor = this;

  result[namespace] = this.extractEmbedded(this.raw);

  Ember.keys(extractor.sideloads).forEach(function(key){
    result[key] = extractor.sideloads[key];
  });

  return result;
};

EmbedExtractor.prototype.addSideload = function(key, object){
  key = Ember.Inflector.inflector.pluralize(key);

  if (!this.sideloads[key]) { this.sideloads[key] = []; }

  this.sideloads[key].push(object);
};

EmbedExtractor.prototype.extractEmbedded = function(hash){
  var extractor = this;
  var result = hash;
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

        extractor.addSideload(key, extracted);
      });

      result[key] = embeddedIds;

    } else {
      value = extractor.extractEmbedded(value);
      var id = value.id;
      result[key] = id;

      extractor.addSideload(key, value);
    }
  });

  return result;
};

export default EmbedExtractor;
