import {
  test,
  moduleForModel
} from "ember-qunit";
import { stubRequest } from 'ember-cli-fake-server';
import Ember from "ember";

function getMetadata(store, type) {
  return store._metadataFor(type);
}

moduleForModel('moose', 'Metadata', {
  needs: ['serializer:application', 'adapter:application']
});

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

  const store = this.store();
  return store.findAll('moose').then(function(mooses){
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

  const store = this.store();
  return store.query('moose', {}).then(function(mooses){
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

  const store = this.store();
  return store.findAll('moose').then(function(mooses){
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

  const store = this.store();
  return store.findAll('moose').then(function(mooses){
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

  const store = this.store();
  return Ember.run(function(){
    store.findRecord('moose', 'moose-9000').then(function(mooses){
      assert.deepEqual(getMetadata(store, 'moose'), {page: 1, total_pages: 2});
    });
  });
});
