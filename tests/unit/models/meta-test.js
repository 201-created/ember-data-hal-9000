import {
  test,
  moduleForModel
} from "ember-qunit";
import Pretender from "pretender";
import Ember from "ember";

var server;

moduleForModel('moose', 'Metadata', {
  needs: ['serializer:application', 'adapter:application'],
  teardown: function(){
    if (server) {
      server.shutdown();
      server = null;
    }
  }
});

test('loads meta data from top-level non-reserved keys for collection resources', function(){
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
  return store.find('moose').then(function(mooses){
    var meta = store.metadataFor('moose');

    deepEqual(meta, {page: 1, total_pages: 2});
  });
});

test('loads meta data from explicit `meta` key for collections', function(){
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
  return store.find('moose').then(function(mooses){
    var meta = store.metadataFor('moose');

    deepEqual(meta, {page: 1, total_pages: 2});
  });
});

test('sets links as meta data for collections', function(){
  server = new Pretender(function(){
    this.get('/mooses', function(){
      return [200, {}, {
        _links: {
          self: { href: '/mooses' }
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
  return store.find('moose').then(function(mooses){
    var meta = store.metadataFor('moose');

    deepEqual(meta, {links: {self: '/mooses'}});
  });
});

test('loads meta data from explicit `meta` key for single resources', function(){
  server = new Pretender(function(){
    this.get('/mooses/1', function(){
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
    store.find('moose', 1).then(function(mooses){
      var meta = store.metadataFor('moose');

      deepEqual(meta, {page: 1, total_pages: 2});
    });
  });
});
