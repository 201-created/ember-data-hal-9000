/* global QUnit */
import {
  test
} from "ember-qunit";
import Ember from "ember";
import EmbedExtractor from "ember-data-hal-9000/embed-extractor";

QUnit.module('EmbedExtractor - extractArray');

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

test('moves array embeds out of _embedded and into top-level', function(assert){
  var raw = {
    _embedded: {
      users: [{
        id: 1,
        name: 'Cory'
      }]
    }
  };

  var extracted = new EmbedExtractor(raw, mockStore, mockSerializer).
    extractArray(mockUserType);

  assert.deepEqual(extracted, {
    users: [{
      id: 1,
      name: 'Cory'
    }]
  });
});

test('deeply embedded', function(assert){
  var raw = {
    _embedded: {
      users: [{
        id: 1,
        name: 'Cory',
        _embedded: {
          color: {
            id: 'c1', color: 'blue'
          },
          friends: [{
            id: 'f1', name:'friend1',
          }, {
            id: 'f2', name:'friend2',
          }]
        }
      }]
    }
  };

  var extracted = new EmbedExtractor(raw, mockStore, mockSerializer).
    extractArray(mockUserType);

  assert.deepEqual(extracted, {
    users: [{
      id: 1,
      name: 'Cory',
      friends: ['f1','f2'],
      color: 'c1'
    }],
    friends: [{
      id: 'f1', name:'friend1',
    }, {
      id: 'f2', name:'friend2',
    }],
    colors: [{
      id: 'c1', color: 'blue'
    }]
  });
});
