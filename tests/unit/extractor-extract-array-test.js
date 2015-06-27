/* global QUnit */
import {
  test
} from "ember-qunit";
import Ember from "ember";
import Normalizer from "ember-data-hal-9000/normalizer";

QUnit.module('Normalizer - collections');

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

test('#normalizeResponse returns JSON API format for simple collections', function(assert){
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
    normalizeResponse();

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

test('#normalizeResponse returns JSON API with nested embeds', function(assert){
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
    modelName: 'user'
  };
  var id, requestType;
  var store = mockStore;

  var response = new Normalizer(store, primaryModelClass, payload, id, requestType).
    normalizeResponse();

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
            type: 'friend', id: 'f1'
          }, {
            type: 'friend', id: 'f2'
          }]
        },
        colors: {
          data: [{
            id: 'c1', type: 'color'
          }]
        }
      }
    }],
    included: [{
      type: 'friend',
      id: 'f1',
      attributes: {
        name: 'friend1'
      }
    }, {
      type: 'friend',
      id: 'f1',
      attributes: {
        name: 'friend1'
      }
    }, {
      type: 'color',
      id: 'c1',
      attributes: {
        color: 'blue'
      }
    }]
  });
});
