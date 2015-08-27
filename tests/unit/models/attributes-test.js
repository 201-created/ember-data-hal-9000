import {
  test,
  moduleForModel
} from "ember-qunit";
import { stubRequest } from 'ember-cli-fake-server';
import Ember from "ember";

moduleForModel('car', 'Attributes', {
  needs: ['serializer:application', 'adapter:application', 'transform:temperature',
  'model:attribute']
});

test('allows `attributes` attributes and relations', function(assert){
  assert.expect(1);

  stubRequest('get', '/cars/1', (request) => {
    request.ok({
      id: 1,
      make: 'foo',
      model: 'bar',

      _links: {
        self: { href: '/cars/1' },
        attributes: {href: '/cars/1/attributes'}
      }
    });
  });

  stubRequest('get', '/cars/1/attributes', (request) => {
    request.ok({
      _links: {self: {href: '/cars/1/attributes'}},
      _embedded: {
        attributes: [{
          id: 'some-attribute',
          attributes: 2
        }]
      }
    });
  });

  const store = this.store();
  return Ember.run(function(){
    return store.findRecord('car', 1).then(function(car){
      return car.get('attributes').then(attributes => {
        assert.equal(attributes.get('firstObject.attributes'), 2);
      });
    });
  });
});
