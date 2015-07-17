/* global QUnit */
import {
  test
} from "ember-qunit";
import Ember from "ember";
import Normalizer from "ember-data-hal-9000/normalizer";

QUnit.module('Unit: Normalizer - normalizeSingleResponse');

var mockStore = {
  adapterFor: function(){
    return mockAdapter;
  },

  modelFor: function(typeKey){
    return {
      modelName: typeKey,
      eachRelationship: Ember.K,
      relationshipsByName: {
        get: Ember.K
      }
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
  eachRelationship: Ember.K,
  relationshipsByName: {
    get: Ember.K
  }
};



test('puts simple payload in namespace', function(assert){
  const payload = {
    id: '1',
    name: 'Cory',
    type: 'user'
  };
  const store = mockStore;
  const primaryModelClass = mockUserType;
  const id = '1';
  let requestType; // n/a

  var response = new Normalizer(store, primaryModelClass, payload, id, requestType).
    normalizeSingleResponse();
  assert.deepEqual(
    response,
    {
      data: {
        id: '1',
        type: 'user',
        attributes: {
          name: 'Cory'
        }
      }
    }
  );
});

test('embedded single objects put in `included`', function(assert){
  const payload = {
    id: '1',
    name: '@bantic',
    _embedded: {
      car: {
        id: 'car-1',
        model: 'miata'
      }
    }
  };
  const store = mockStore;
  const primaryModelClass = mockUserType;
  const id = '1';
  let requestType; // n/a

  const response = new Normalizer(store, primaryModelClass, payload, id, requestType).
    normalizeSingleResponse();
  assert.deepEqual(
    response,
    {
      data: {
        id: '1',
        type: 'user',
        attributes: {
          name: '@bantic'
        },
        relationships: {
          car: {
            data: {
              id: 'car-1', type: 'car'
            }
          }
        }
      },
      included: [{
        id: 'car-1',
        type: 'car',
        attributes: {
          model: 'miata'
        }
      }]
    }
  );
});

test('embedded arrays of objects are replaced by array of ids and sideloaded', function(assert){
  const payload = {
    id: '1',
    name: 'blah',
    _embedded: {
      cars: [{
        id: 'car-1',
        model: 'miata'
      }]
    }
  };

  const store = mockStore;
  const primaryModelClass = mockUserType;
  const id = '1';
  let requestType; // n/a

  const response = new Normalizer(store, primaryModelClass, payload, id, requestType).
    normalizeSingleResponse();

  assert.deepEqual(response, {
    data: {
      id: '1',
      type: 'user',
      attributes: { name: 'blah' },
      relationships: {
        cars: {
          data: [{
            id: 'car-1',
            type: 'cars'
          }]
        }
      }
    },
    included: [{
      type: 'cars',
      id: 'car-1',
      attributes: {
        model: 'miata'
      }
    }]
  });
});

test('deeply embedded objects and arrays are replaced by array/single ids and sideloaded', function(assert){
  const payload = {
    id: '1',
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

  const store = mockStore;
  const primaryModelClass = mockUserType;
  const id = '1';
  let requestType; // n/a

  const response = new Normalizer(store, primaryModelClass, payload, id, requestType).
    normalizeSingleResponse();

  assert.deepEqual(response, {
    data: {
      id: '1',
      type: 'user',
      attributes: { name: 'blah' },
      relationships: {
        cars: {
          data: [{id: 'car-1', type: 'cars'}]
        }
      }
    },
    included: [{
      id: 'car-1',
      type: 'cars',
      attributes: {
        model: 'miata'
      },
      relationships: {
        driver: {
          data: {id: 'd1', type: 'driver'}
        }
      }
    }, {
      id: 'd1',
      type: 'driver',
      attributes: {
        name: 'driver 1'
      },
      relationships: {
        'favorite-colors': {
          data: [{
            id: 'c1', type: 'favoriteColors'
          }, {
            id: 'c2', type: 'favoriteColors'
          }]
        }
      }
    }, {
      id: 'c1',
      type: 'favoriteColors',
      attributes: { color: 'blue' }
    }, {
      id: 'c2',
      type: 'favoriteColors',
      attributes: { color: 'red' }
    }]
  });
});
