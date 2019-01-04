import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { stubRequest, setupFakeServer } from 'ember-cli-fake-server';

module('Transformer', function(hooks) {
  setupTest(hooks);
  setupFakeServer(hooks);

  test('transforms attributes using transformers', async function(assert) {
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

    const store = this.owner.lookup('service:store');

    let requirement = await store.findRecord('requirement', 1);

    // according to wolframalpha this equals 50°C
    // http://www.wolframalpha.com/input/?i=convert+122%C2%B0F+to+degrees+celsius
    requirement.set('temperature', 122);

    await requirement.save();
  });
});
