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
    if (typeKey === 'referred_by') {
      return 'user';
    }
    return Ember.Inflector.inflector.singularize(typeKey);
  }
};

var mockUserType = {
  modelName: 'user',
  eachRelationship: function (fn) {
    fn('referred_by', {
      type: 'user',
      key: 'referred_by'
    });
    return this;
  }
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

test('embedded circular', function(assert){
  var raw = {
    _embedded: {
      users: [{
        id: 'u1',
        _embedded: {
          referred_by: { id: 'u3' }
        }
      },
      {
        id: 'u2'
      }]
    }
  };

  var extracted = new EmbedExtractor(raw, mockStore, mockSerializer).
    extractArray(mockUserType);

  assert.deepEqual(extracted, {
    users: [{ id: 'u1', 'referred_by': 'u3' }, { id: 'u2' }],
    _users: [{ id: 'u3' }]
  });
});
