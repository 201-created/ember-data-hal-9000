import {
  test
} from "ember-qunit";
import Ember from "ember";
import EmbedExtractor from "ember-data-hal-9000/embed-extractor";


module('EmbedExtractor - extractArray');

test('moves array embeds out of _embedded and into top-level', function(){
  var raw = {
    _embedded: {
      users: [{
        id: 1,
        name: 'Cory'
      }]
    }
  };

  var extracted = new EmbedExtractor(raw).extractArray();

  deepEqual(extracted, {
    users: [{
      id: 1,
      name: 'Cory'
    }]
  });
});

test('deeply embedded', function(){
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

  var extracted = new EmbedExtractor(raw).extractArray();

  deepEqual(extracted, {
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
