import {
  test
} from "ember-qunit";
import Ember from "ember";
import EmbedExtractor from "ember-data-hal-9000/embed-extractor";


module('EmbedExtractor - extractSingle');

test('it exists', function(){
  ok(EmbedExtractor, 'it exists');
});

test('puts simple payload in namespace', function(){
  var raw = {
    id: '1',
    _links: {
      self: { href: '/me' }
    }
  };

  var extracted = new EmbedExtractor(raw).extractSingle('user');
  deepEqual(extracted, {user: raw});
});

test('embedded single objects are replaced by ids and sideloaded', function(){
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

  var extracted = new EmbedExtractor(raw).extractSingle('user');

  deepEqual(extracted, {
    user: {
      id: 1,
      name: 'blah',
      car: 'car-1'
    },
    cars: [{
      id: 'car-1',
      model: 'miata'
    }]
  });
});

test('embedded arrays of objects are replaced by array of ids and sideloaded', function(){
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

  var extracted = new EmbedExtractor(raw).extractSingle('user');

  deepEqual(extracted, {
    user: {
      id: 1,
      name: 'blah',
      cars: ['car-1']
    },
    cars: [{
      id: 'car-1',
      model: 'miata'
    }]
  });
});

test('deeply embedded objects and arrays are replaced by array/single ids and sideloaded', function(){
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

  var extracted = new EmbedExtractor(raw).extractSingle('user');

  deepEqual(extracted, {
    user: {
      id: 1,
      name: 'blah',
      cars: ['car-1']
    },
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
