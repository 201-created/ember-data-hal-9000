/* global QUnit */
import {
  test
} from "ember-qunit";
import Ember from "ember";
import EmbedExtractor from "ember-data-hal-9000/embed-extractor";

QUnit.module('EmbedExtractor - extractSingle');

var mockStore = {
  adapterFor: function(){
    return mockAdapter;
  },

  modelFor: function(typeKey){
    return {
      modelName: typeKey,
      eachRelationship: Ember.K
    };
  },

  modelFactoryFor: function(){
    return true;
  },

  serializerFor: function(){
    return mockSerializer;
  }
};

var mockAdapter = {
  pathForType: function(typeKey){
    return Ember.Inflector.inflector.pluralize(typeKey);
  }
};

var mockSerializer = {
  modelNameFromPayloadKey: function(typeKey){
    return Ember.Inflector.inflector.singularize(typeKey);
  }
};

var mockUserType = {
  modelName: 'user',
  eachRelationship: Ember.K
};



test('it exists', function(assert){
  assert.ok(EmbedExtractor, 'it exists');
});

test('puts simple payload in namespace', function(assert){
  var raw = {
    id: '1',
    _links: {
      self: { href: '/me' }
    }
  };

  var extracted = new EmbedExtractor(raw, mockStore, mockSerializer).
    extractSingle(mockUserType);
  assert.deepEqual(extracted, {users: [raw]});
});

test('embedded single objects are replaced by ids and sideloaded', function(assert){
  var raw = {
    id: 1,
    name: 'blah',
    _embedded: {
      car: {
        id: 'car-1',
        model: 'miata'
      }
    }
  };

  var extracted = new EmbedExtractor(raw, mockStore, mockSerializer).
    extractSingle(mockUserType);

  assert.deepEqual(extracted, {
    users: [{
      id: 1,
      name: 'blah',
      car: 'car-1'
    }],
    cars: [{
      id: 'car-1',
      model: 'miata'
    }]
  });
});

test('embedded arrays of objects are replaced by array of ids and sideloaded', function(assert){
  var raw = {
    id: 1,
    name: 'blah',
    _embedded: {
      cars: [{
        id: 'car-1',
        model: 'miata'
      }]
    }
  };

  var extracted = new EmbedExtractor(raw, mockStore, mockSerializer).
    extractSingle(mockUserType);

  assert.deepEqual(extracted, {
    users: [{
      id: 1,
      name: 'blah',
      cars: ['car-1']
    }],
    cars: [{
      id: 'car-1',
      model: 'miata'
    }]
  });
});

test('deeply embedded objects and arrays are replaced by array/single ids and sideloaded', function(assert){
  var raw = {
    id: 1,
    name: 'blah',
    _embedded: {
      cars: [{
        id: 'car-1',
        model: 'miata',
        _embedded: {
          driver: {
            id: 'd1',
            name: 'driver 1',
            _embedded: {
              favoriteColors: [{
                id: 'c1', color: 'blue',
              }, {
                id: 'c2', color: 'red'
              }]
            }
          }
        }
      }]
    }
  };

  var extracted = new EmbedExtractor(raw, mockStore, mockSerializer).
    extractSingle(mockUserType);

  assert.deepEqual(extracted, {
    users: [{
      id: 1,
      name: 'blah',
      cars: ['car-1']
    }],
    drivers: [{
      id: 'd1',
      name: 'driver 1',
      favoriteColors: ['c1','c2']
    }],
    cars: [{
      id: 'car-1',
      model: 'miata',
      driver: 'd1'
    }],
    favoriteColors: [{
      id: 'c1', color: 'blue',
    }, {
      id: 'c2', color: 'red'
    }]
  });
});
