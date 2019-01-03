import { run } from '@ember/runloop';
import {
  test,
  moduleForModel
} from "ember-qunit";
import { stubRequest } from 'ember-cli-fake-server';

moduleForModel('requirement', 'Transformer', {
  needs: ['serializer:application', 'adapter:application', 'transform:temperature']
});

test('transforms attributes using transformers', function(assert){
  assert.expect(2);

  stubRequest('get', '/requirements/1', (request) => {
    request.ok({
      id: 1,
      name: 'hot',
      temperature: 40,
      _links: {
        self: { href: '/requirements/1' }
      }
    });
  });

  stubRequest('patch', '/requirements/1', (request) => {
    let body = JSON.parse(request.requestBody);
    assert.strictEqual(body.data.attributes.temperature, 50);

    request.noContent();
  });

  const store = this.store();
  return run(function(){
    return store.findRecord('requirement', 1).then(function(requirement){
      // according to wolframalpha this equals 104°F
      // http://www.wolframalpha.com/input/?i=convert+40%C2%B0C+to+degrees+fahrenheit
      assert.strictEqual(requirement.get('temperature'), 104);

      // according to wolframalpha this equals 50°C
      // http://www.wolframalpha.com/input/?i=convert+122%C2%B0F+to+degrees+celsius
      requirement.set('temperature', 122);

      requirement.save();
    });
  });
});
