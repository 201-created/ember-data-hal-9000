import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { stubRequest, setupFakeServer } from 'ember-cli-fake-server';

module('Metadata', function(hooks) {
  setupTest(hooks);
  setupFakeServer(hooks);

  test('loads meta data from top-level non-reserved keys for collection resources', async function(assert) {
    stubRequest('get', '/mooses', (request) => {
      request.ok({
        page: 1,
        total_pages: 2,
        _embedded: {
          mooses: [{
            id: 'moose-9000',
            _links: {
              self: {
                href: 'http://example.com/mooses/moose-9000'
              }
            }
          }]
        }
      });
    });

    const store = this.owner.lookup('service:store');

    let moose = await store.query('moose', {});
    assert.deepEqual(moose.meta, { page: 1, total_pages: 2 });
  });

  test('loads meta data from top-level non-reserved keys for collection resources returned from store.query', async function(assert) {
    stubRequest('get', '/mooses', (request) => {
      request.ok({
        page: 1,
        total_pages: 2,
        _embedded: {
          mooses: [{
            id: 'moose-9000',
            _links: {
              self: {
                href: 'http://example.com/mooses/moose-9000'
              }
            }
          }]
        }
      });
    });

    const store = this.owner.lookup('service:store');
    let moose = await store.query('moose', {});
    assert.deepEqual(moose.meta, { page: 1, total_pages: 2 });
  });

  test('loads meta data from explicit `meta` key for collections', async function(assert) {
    stubRequest('get', '/mooses', (request) => {
      request.ok({
        meta: {
          page: 1,
          total_pages: 2
        },
        _embedded: {
          mooses: [{
            id: 'moose-9000',
            _links: {
              self: {
                href: 'http://example.com/mooses/moose-9000'
              }
            }
          }]
        }
      });
    });

    const store = this.owner.lookup('service:store');
    let moose = await store.query('moose', {});
    assert.deepEqual(moose.meta, { page: 1, total_pages: 2 });
  });

  test('includes links in meta data for collections', async function(assert) {
    stubRequest('get', '/mooses', (request) => {
      request.ok({
        _links: {
          self: { href: '/mooses' }
        },
        some_meta_val: 42,
        _embedded: {
          mooses: [{
            id: 'moose-9000',
            _links: {
              self: {
                href: 'http://example.com/mooses/moose-9000'
              }
            }
          }]
        }
      });
    });

    const store = this.owner.lookup('service:store');
    let moose = await store.query('moose', {});
    assert.deepEqual(moose.meta, { links: { self: '/mooses' }, some_meta_val: 42 });
  });

  test('loads meta data from explicit `meta` key for single resources', async function(assert) {
    stubRequest('get', '/mooses/moose-9000', (request) => {
      request.ok({
        meta: {
          page: 1,
          total_pages: 2
        },
        _links: {
          self: { href: '/mooses/1' }
        },
        id: 'moose-9000'
      });
    });

    const store = this.owner.lookup('service:store');
    let moose = await store.findRecord('moose', 'moose-9000');
    // assert.deepEqual(moose.meta, { page: 1, total_pages: 2 }); // TODO: This is currently not supported by Ember Data...
    assert.deepEqual(moose.meta, undefined);
  });
});
