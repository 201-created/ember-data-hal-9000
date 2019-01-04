import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { stubRequest, setupFakeServer } from 'ember-cli-fake-server';

module('Attributes', function(hooks) {
  setupTest(hooks);
  setupFakeServer(hooks);

  test('allows `attributes` attributes and relations', function(assert) {
    assert.expect(1);

    stubRequest('get', '/cars/1', (request) => {
      request.ok({
        id: 1,
        make: 'foo',
        model: 'bar',

        _links: {
          self: { href: '/cars/1' },
          attributes: { href: '/cars/1/attributes' }
        }
      });
    });

    stubRequest('get', '/cars/1/attributes', (request) => {
      request.ok({
        _links: { self: { href: '/cars/1/attributes' } },
        _embedded: {
          attributes: [{
            id: 'some-attribute',
            attributes: 2
          }]
        }
      });
    });

    const store = this.owner.lookup('service:store');
    return run(function() {
      return store.findRecord('car', 1).then(function(car) {
        return car.get('attributes').then(attributes => {
          assert.equal(attributes.get('firstObject.attributes'), 2);
        });
      });
    });
  });
});
