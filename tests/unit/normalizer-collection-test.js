/* global QUnit */
import {
  test
} from "ember-qunit";
import Ember from "ember";
import Normalizer from "ember-data-hal-9000/normalizer";

QUnit.module('Unit: Normalizer - normalizeArrayResponse');

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
    return Ember.String.pluralize(typeKey);
  }
};

var mockSerializer = {
  modelNameFromPayloadKey: function(typeKey){
    return Ember.String.singularize(typeKey);
  }
};

var mockUserType = {
  modelName: 'user',
  eachRelationship: Ember.K
};

test('#normalizeArrayResponse returns JSON API format for simple collections', function(assert){
  var payload = {
    _embedded: {
      users: [{
        id: 1,
        name: 'Cory'
      }]
    }
  };

  var mockModelClass = {
    modelName: 'user'
  };
  var store = mockStore;

  var primaryModelClass = mockModelClass;
  var id, requestType; // n/a

  var response = new Normalizer(store, primaryModelClass, payload, id, requestType).
    normalizeArrayResponse();

  assert.deepEqual(response, {
    data: [{
      id: 1,
      type: 'user',
      attributes: {
        name: 'Cory'
      }
    }]
  });
});

test('#normalizeArrayResponse returns JSON API with nested embeds', function(assert){
  var payload = {
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

  var primaryModelClass = {
    modelName: 'user',
    eachRelationship(callback) {
      let key = 'color',
          kind = 'belongsTo';
      callback(key, {kind});

      key = 'friends';
      kind = 'hasMany';
      callback(key, {kind});
    }
  };
  var id, requestType;
  var store = mockStore;
  store.modelFor = (name) => {
    if (name === 'user') {
      return primaryModelClass;
    } else {
      return {
        modelName: Ember.String.singularize(name),
        eachRelationship: Ember.K
      };
    }
  };

  var response = new Normalizer(store, primaryModelClass, payload, id, requestType).
    normalizeArrayResponse();

  assert.deepEqual(response, {
    data: [{
      id: 1,
      type: 'user',
      attributes: {
        name: 'Cory'
      },
      relationships: {
        friends: {
          data: [{
            type: 'friends', id: 'f1'
          }, {
            type: 'friends', id: 'f2'
          }]
        },
        color: {
          data: {
            id: 'c1', type: 'color'
          }
        }
      }
    }],
    included: [{
      type: 'color',
      id: 'c1',
      attributes: {
        color: 'blue'
      }
    }, {
      type: 'friends',
      id: 'f1',
      attributes: {
        name: 'friend1'
      }
    }, {
      type: 'friends',
      id: 'f2',
      attributes: {
        name: 'friend2'
      }
    }]
  });
});
