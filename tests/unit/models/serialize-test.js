import {
  test,
  moduleForModel
} from "ember-qunit";
import { stubRequest } from 'ember-cli-fake-server';
import Ember from "ember";

let {extend} = Ember.$;
let {RSVP} = Ember;

moduleForModel('car', 'serialize', {
  needs: ['serializer:application', 'adapter:application', 'transform:temperature',
    'model:attribute', 'model:user', 'model:team', 'model:wheel', 'model:owner']
});

test('serializes loaded record relationships (hasMany, belongsTo) with `serialize: true`', function (assert) {
  assert.expect(1);
  const INPUT = {
    id: 1,
    make: 'foo',
    model: 'bar',

    _links: {
      self: {href: '/cars/1'},
      attributes: {href: '/cars/1/attributes'},
      owner: {href: '/cars/1/owner'}
    }
  };

  stubRequest('get', `/cars/${INPUT.id}`, (request) =>
    request.ok(INPUT));

  stubRequest('get', `/cars/${INPUT.id}/owner`, (request) =>
    request.ok({
      id: 'owner1',
      name: 'owner #1',
      _links: {
        self: { href: "/owners/owner1" }
      }
    }));

  stubRequest('get', '/cars/1/attributes', (request) => {
    request.ok({
      _links: {self: {href: '/cars/1/attributes'}},
      _embedded: {
        attributes: [{
          id: 'some-attribute',
          attributes: 2
        }]
      }
    });
  });

  stubRequest('patch', `/cars/${INPUT.id}`, (request) => {
    assert.deepEqual(JSON.parse(request.requestBody), {
      "_embedded": {
        "attributes": [{
          "attributes": 2,
          "id": "some-attribute"
        }],
        "owner": {
          "id": "owner1",
          "name": "owner #1"
        }
      },
      "id": "1",
      "make": "foo",
      "model": "bar"
    });
    request.ok(INPUT);
  });

  const store = this.store();
  return Ember.run(() =>
    store.findRecord('car', INPUT.id).then((car) =>
      RSVP.all([
        car.get('attributes'),
        car.get('owner')
      ]).then(() => {
        return car.save();
      })));
});

test('serializes record correctly', function (assert) {
  assert.expect(2);
  const INPUT = {
      "id": "55b21c520fabf0ba57bf0631",
      "email": "user@site.com",
      "user_type": "power",
      "profile": {
        "nickname": "SuperJoe",
        "bio": null
      },
      "_updated": "Fri, 24 Jul 2015 11:06:58 GMT",
      "_created": "Fri, 24 Jul 2015 11:06:58 GMT",
      "_etag": "f6687527bd6a10205d7c1462109e6193b58c8ae9"
    };

  stubRequest('get', `/users/${INPUT.id}`, (request) =>
    request.ok(INPUT));

  stubRequest('patch', `/users/${INPUT.id}`, (request) => {
    assert.deepEqual(JSON.parse(request.requestBody), INPUT);
    request.ok(INPUT);
  });

  const store = this.store();
  return Ember.run(() =>
    store.findRecord('user', INPUT.id).then((user) => {
      assert.deepEqual(user.toJSON({includeId: true}), INPUT);
      user.save();
    }));
});
