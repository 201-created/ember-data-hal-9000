import {
  test,
  moduleForModel
} from "ember-qunit";
import { stubRequest } from 'ember-cli-fake-server';
import Ember from "ember";

moduleForModel('attr', 'Attributes', {
  needs: ['serializer:application', 'adapter:application', 'transform:temperature',
  'model:attribute']
});

test('uses serializers attrs key', function(assert){
  assert.expect(2);

  stubRequest('get', '/attrs/1', (request) => {
    request.ok({
      id: 1,
      is_admin: true,
      career: 'ninja'
    });
  });

  const store = this.store();
  return Ember.run(function(){
    return store.findRecord('attr', 1).then(function(attr){
      assert.equal(attr.get('admin'), true);
      assert.equal(attr.get('occupation'), 'ninja');
    });
  });
});
