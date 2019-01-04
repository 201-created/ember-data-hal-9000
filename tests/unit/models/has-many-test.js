import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from "ember-qunit";
import { stubRequest, setupFakeServer } from 'ember-cli-fake-server';

module('Car : hasMany', function(hooks) {
  setupTest(hooks);
  setupFakeServer(hooks);

  test('car#hasMany wheels loads wheels from link', function(assert){
    const store = this.owner.lookup('service:store');

    stubRequest('get', '/cars/1', (request) => {
      request.ok({
        id: '1',
        make: 'Miata',
        model: 'Pretender',
        _links: {
          self: { href: '/cars/1' },
          wheels: {
            href: '/cars/1/wheels'
          }
        }
      });
    });

    stubRequest('get', '/cars/1/wheels', (request) => {
      request.ok({
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
      });
    });

    return run(function(){
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


  test('car#hasMany wheels loads wheels from link without breaking because of hal link object', function(assert){
    const store = this.owner.lookup('service:store');

    stubRequest('get', '/cars/1', (request) => {
      request.ok({
        id: '1',
        make: 'Miata',
        model: 'Pretender',
        _links: {
          self: { href: '/cars/1' },
          wheels: {
            href: '/cars/1/wheels',
            name: 'Car wheels'
          }
        }
      });
    });

    stubRequest('get', '/cars/1/wheels', (request) => {
      request.ok({
        _links: {
          self: {
            href: '/cars/1/wheels',
            name: 'Car wheels'
          }
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
      });
    });

    return run(function(){
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
});

