import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from "ember-qunit";
import { stubRequest } from 'ember-cli-fake-server';

function getMetadata(store, type) {
  return store._metadataFor(type);
}

module('Metadata', function(hooks) {
  setupTest(hooks);

  test('loads meta data from top-level non-reserved keys for collection resources', function(assert){
    stubRequest('get', '/mooses', (request) => {
      request.ok({
        page: 1,
        total_pages: 2,
        _embedded: {
          mooses: [{
            id: 'moose-9000',
            _links: {
              self: {
                href: "http://example.com/mooses/moose-9000"
              }
            }
          }]
        }
      });
    });

    const store = this.owner.lookup('service:store');
    return store.findAll('moose').then(function(){
      assert.deepEqual(getMetadata(store, 'moose'), {page: 1, total_pages: 2});
    });
  });

  test('loads meta data from top-level non-reserved keys for collection resources returned from store.query', function(assert){
    stubRequest('get', '/mooses', (request) => {
      request.ok({
        page: 1,
        total_pages: 2,
        _embedded: {
          mooses: [{
            id: 'moose-9000',
            _links: {
              self: {
                href: "http://example.com/mooses/moose-9000"
              }
            }
          }]
        }
      });
    });

    const store = this.owner.lookup('service:store');
    return store.query('moose', {}).then(function(){
      assert.deepEqual(getMetadata(store, 'moose'), {page: 1, total_pages: 2});
    });
  });

  test('loads meta data from explicit `meta` key for collections', function(assert){
    stubRequest('get', '/mooses', (request) => {
      request.ok({
        meta: {
          page: 1,
          total_pages: 2,
        },
        _embedded: {
          mooses: [{
            id: 'moose-9000',
            _links: {
              self: {
                href: "http://example.com/mooses/moose-9000"
              }
            }
          }]
        }
      });
    });

    const store = this.owner.lookup('service:store');
    return store.findAll('moose').then(function(){
      assert.deepEqual(getMetadata(store, 'moose'), {page: 1, total_pages: 2});
    });
  });

  test('includes links in meta data for collections', function(assert){
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
                href: "http://example.com/mooses/moose-9000"
              }
            }
          }]
        }
      });
    });

    const store = this.owner.lookup('service:store');
    return store.findAll('moose').then(function(){
      assert.deepEqual(getMetadata(store, 'moose'),
                       {links: {self: '/mooses'}, some_meta_val: 42});
    });
  });

  test('loads meta data from explicit `meta` key for single resources', function(assert){
    stubRequest('get', '/mooses/moose-9000', (request) => {
      request.ok({
        meta: {
          page: 1,
          total_pages: 2,
        },
        _links: {
          self: { href: '/mooses/1' }
        },
        id: 'moose-9000'
      });
    });

    const store = this.owner.lookup('service:store');
    return run(function(){
      store.findRecord('moose', 'moose-9000').then(function(){
        assert.deepEqual(getMetadata(store, 'moose'), {page: 1, total_pages: 2});
      });
    });
  });
});
