import {
  test,
  moduleForModel
} from "ember-qunit";
import Pretender from "pretender";
import Ember from "ember";

var server;

function getMetadata(store, type) {
  return store._metadataFor(type);
}

moduleForModel('moose', 'Metadata', {
  needs: ['serializer:application', 'adapter:application'],
  teardown: function(){
    if (server) {
      server.shutdown();
      server = null;
    }
  }
});

test('loads meta data from top-level non-reserved keys for collection resources', function(assert){
  server = new Pretender(function(){
    this.get('/mooses', function(){
      return [200, {}, {
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
      }];
    });
  });

  var store = this.store();
  return store.findAll('moose').then(function(mooses){
    assert.deepEqual(getMetadata(store, 'moose'), {page: 1, total_pages: 2});
  });
});

test('loads meta data from explicit `meta` key for collections', function(assert){
  server = new Pretender(function(){
    this.get('/mooses', function(){
      return [200, {}, {
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
      }];
    });
  });

  var store = this.store();
  return store.findAll('moose').then(function(mooses){
    assert.deepEqual(getMetadata(store, 'moose'), {page: 1, total_pages: 2});
  });
});

test('includes links in meta data for collections', function(assert){
  server = new Pretender(function(){
    this.get('/mooses', function(){
      return [200, {}, {
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
      }];
    });
  });

  var store = this.store();
  return store.findAll('moose').then(function(mooses){
    assert.deepEqual(getMetadata(store, 'moose'),
                     {links: {self: '/mooses'}, some_meta_val: 42});
  });
});

test('loads meta data from explicit `meta` key for single resources', function(assert){
  server = new Pretender(function(){
    this.get('/mooses/moose-9000', function(){
      return [200, {}, {
        meta: {
          page: 1,
          total_pages: 2,
        },
        _links: {
          self: { href: '/mooses/1' }
        },
        id: 'moose-9000'
      }];
    });
  });

  var store = this.store();
  return Ember.run(function(){
    store.findRecord('moose', 'moose-9000').then(function(mooses){
      assert.deepEqual(getMetadata(store, 'moose'), {page: 1, total_pages: 2});
    });
  });
});
