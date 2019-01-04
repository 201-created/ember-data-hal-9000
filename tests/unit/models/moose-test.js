import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from "ember-qunit";
import { stubRequest, setupFakeServer } from 'ember-cli-fake-server';

module('Moose model', function(hooks) {
  setupTest(hooks);
  setupFakeServer(hooks);

  test('loads a HAL formatted record', function(assert){
    stubRequest('get', '/mooses', (request) => {
      request.ok({
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
      });
    });

    return this.owner.lookup('service:store').findAll('moose').then(function(mooses){
      assert.ok(mooses, 'records found');
      assert.ok(mooses.get('length') > 0, 'many records found');
      assert.ok(mooses.get('firstObject.id'), 'moose-9000', 'record loaded');
    });
  });

  test('loads attribute on a HAL formatted record', function(assert){
    stubRequest('get', '/mooses', (request) => {
      request.ok({
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
      });
    });

    return this.owner.lookup('service:store').findAll('moose').then(function(mooses){
      assert.ok(mooses, 'records found');
      assert.ok(mooses.get('firstObject.name'), 'Marcy', 'record has an attribute');
    });
  });

  test('loads single HAL formatted record', function(assert){
    stubRequest('get', '/mooses/moose-9000', (request) => {
      request.ok({
        _links: {
          self: {
            href: "http://example.com/mooses/moose-9000"
          }
        },
        id: 'moose-9000',
        name: 'Marcy'
      });
    });

    const store = this.owner.lookup('service:store');

    return run(function(){
      return store.find('moose', 'moose-9000').then(function(moose){
        assert.ok(moose, 'record found');
        assert.ok(moose.get('id'), 'moose-9000', 'record loaded');
        assert.ok(moose.get('name'), 'Marcy', 'record has an attribute');
      });
    });
  });
});
