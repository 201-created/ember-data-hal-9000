# Ember-data-hal-9000

An ember-data adapter for HAL-style APIs.

See the [IETF HAL Spec](https://tools.ietf.org/html/draft-kelly-json-hal-06) or [this HAL document](http://stateless.co/hal_specification.html) for more info on HAL.

[![Build
Status](https://travis-ci.org/201-created/ember-data-hal-9000.svg?branch=master)](https://travis-ci.org/201-created/ember-data-hal-9000)
[![Code Climate](https://codeclimate.com/github/201-created/ember-data-hal-9000/badges/gpa.svg)](https://codeclimate.com/github/201-created/ember-data-hal-9000)


## Usage

Install `ember-data-hal-9000`:

 * `npm install --save-dev ember-data-hal-9000`
 * Extend your application adapter from the HAL-9000 adapter, e.g.:

```javascript
// app/adapters/application.js

import HalAdapter from "ember-data-hal-9000/adapter";
export default HalAdapter.extend();
```

 * Extend your application serializer from the HAL-9000 serializer, e.g.:

```javascript
// app/serializers/application.js

import HalSerializer from "ember-data-hal-9000/serialzer";
export default HalSerializer.extend();
```

### Meta data

The HAL spec mentions that information about a collection resource can
be included in the root of the JSON payload, alongside the required
`_embedded` key.

The HAL adapter will read all non-reserved property names (i.e., those other
than `_embedded` and `_links`) and set them as meta data. For example:

```javascript
# Assuming GET /users returns this:
{
  _embedded: {
    users: [{...}, ...]
  },
  current_page: 1
}

# Using this code in your route will work:
store.find('user').then(function(){
  console.log( store.metadataFor('user').current_page ); // 1
});
```

Note that this *only works for collection resources*. Singular
resources, according to the HAL spec, have all their properties in the
root of the payload so it is not possible to know which are intended to
be meta data.

For this reason, if your API response includes a `meta` key (for
singular or collection requests), the values in the meta will be set.
Example:

```javascript
# Assuming GET /users/1 returns this:
{
  id: 1,
  name: 'the user',
  meta: {
    my_meta_val: true
  }
}

# Using this code in your route will work:
store.find('user', 1).then(function(){
  console.log( store.metadataFor('user').my_meta_val ); // true
});
```

In addition, *for collection resources only*, the links will be set on
the meta data as well. Example:

```javascript
# Assuming GET /users returns this:
{
  _embedded: { users: [{...}, ...] },
  _links: {
    self: '/users',
    next: '/users?page=2'
  }
}

# Using this code in your route will work:
store.find('user').then(function(){
  console.log( store.metadataFor('user').links.next ); // '/users?page=2'
});
```

Links for a singular resource will be available on the 'data' property,
i.e.:

```
store.get('user', 1).then(function(user){
  console.log( user.get('data.links') ); // {self: '/users/1', ... }
});
```

Note that when a singular resource response includes an embedded
resource, the HAL adapter will sideload that embedded resource and
*delete* the link for that resource, if there is one (otherwise
ember-data will eagerly follow the link when you `get` the associated
resource). Example:

```
# GET /users/1
{
  id: 1,
  name: 'the user',
  _links: {
    self: { href: '/users/1' },
    pet:  { href: '/users/1/pet' }
  },
  _embedded: {
    pet: {
      id: 2,
      name: 'fido'
    }
  }
}

# This code in your route will work
store.get('user', 1).then(function(user){
  return user.get('pet'); // ember-data will use the sideloaded pet and will not GET /users/1/pet
});
```

## Running Tests

* `ember test`
* `ember test --server`
