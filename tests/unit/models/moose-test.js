import {
  test,
  moduleForModel
} from "ember-qunit";
import Pretender from "pretender";
import Ember from "ember";

var server;

moduleForModel('moose', 'Moose model', {
  needs: ['serializer:application', 'adapter:application'],
  teardown: function(){
    if (server) {
      server.shutdown();
      server = null;
    }
  }
});

test('loads a HAL formatted record', function(){
  server = new Pretender(function(){
    this.get('/mooses', function(){
      return [200, {}, {
        _links: {
          self: {
            href: "http://example.com/mooses"
          }
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

  return this.store().find('moose').then(function(mooses){
    ok(mooses, 'records found');
    ok(mooses.get('length') > 0, 'many records found');
    ok(mooses.get('firstObject.id'), 'moose-9000', 'record loaded');
  });
});

test('loads attribute on a HAL formatted record', function(){
  server = new Pretender(function(){
    this.get('/mooses', function(){
      return [200, {}, {
        _links: {
          self: {
            href: "http://example.com/mooses"
          }
        },
        _embedded: {
          mooses: [{
            id: 'moose-9000',
            name: 'Marcy',
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

  return this.store().find('moose').then(function(mooses){
    ok(mooses, 'records found');
    ok(mooses.get('firstObject.name'), 'Marcy', 'record has an attribute');
  });
});

test('loads single HAL formatted record', function(){
  server = new Pretender(function(){
    this.get('/mooses/moose-9000', function(){
      return [200, {}, {
        _links: {
          self: {
            href: "http://example.com/mooses/moose-9000"
          }
        },
        id: 'moose-9000',
        name: 'Marcy'
      }];
    });
  });

  var store = this.store();

  return Ember.run(function(){
    return store.find('moose', 'moose-9000').then(function(moose){
      ok(moose, 'record found');
      ok(moose.get('id'), 'moose-9000', 'record loaded');
      ok(moose.get('name'), 'Marcy', 'record has an attribute');
    });
  });
});
