import {
  test,
  moduleForModel
} from "ember-qunit";
import Pretender from "pretender";
import Ember from "ember";

var server;

moduleForModel('car', 'Car : hasMany', {
  needs: [
    'model:wheel',
    'model:lugnut',
    'model:owner',
    'model:team',

    'serializer:application',
    'adapter:application'
  ],
  teardown: function(){
    if (server) {
      server.shutdown();
      server = null;
    }
  }
});

test('car#hasMany wheels loads wheels from link', function(assert){
  var store = this.store();

  server = new Pretender(function(){
    this.get('/cars/1', function(request){
      return [200, {}, {
        id: '1',
        make: 'Miata',
        model: 'Pretender',
        _links: {
          self: { href: '/cars/1' },
          wheels: {
            href: '/cars/1/wheels'
          }
        }
      }];
    });

    this.get('/cars/1/wheels', function(request){
      return [200, {}, {
        _links: {
          self: { href: '/cars/1/wheels' }
        },
        _embedded: {
          wheels: [{
            id: 'wheel-1',
            hasSnowChains: true
          }, {
            id: 'wheel-2',
            hasSnowChains: false
          }]
        }
      }];
    });
  });

  server.unhandledRequest = function(verb, path, request){
    assert.ok(false, 'unhandled request for ' + verb + ' ' + path);
  };

  return Ember.run(function(){
    return store.findRecord('car', 1).then(function(car){
      return car.get('wheels');
    }).then(function(wheels){
      assert.ok(!!wheels, 'gets wheels');
      assert.equal(wheels.get('length'), 2, 'has 2 wheels');

      var wheel = wheels.get('firstObject');
      assert.ok(wheel.get('hasSnowChains'), 'wheel has snow chains');
    });
  });
});

