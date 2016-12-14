import {
  test,
  moduleFor
} from "ember-qunit";
import { stubRequest } from 'ember-cli-fake-server';
import Ember from "ember";

let App = DS.Model.extend({
  lastDeployOperation: DS.belongsTo('operation', { async: true })
});

let Operation = DS.Model.extend({
  name: DS.attr()
});

moduleFor('adapter:application', {
  needs: ['serializer:application', 'adapter:application'],
  beforeEach() {
    this.store = this.container.lookup('service:store');
    this.container.register('model:app', App);
    this.container.register('model:operation', Operation);
  }
});

test('something test', function(assert) {
  stubRequest('get', '/apps/1', function() {
    return this.success({
      id: '1',
      _embedded: {
        last_deploy_operation: {
          id: 'op-1'
        }
      }
    });
  });

  return Ember.run(() => {
    return this.store.find('app', '1').then(app => {
      assert.ok(!!app);
      return app.get('lastDeployOperation');
    }).then(op => {
      assert.ok(!!op);
      assert.equal(op.get('id'), 'op-1');
    }).catch(e => { e; debugger; });
  });
});
