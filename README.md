[![Build
Status](https://travis-ci.org/201-created/ember-data-hal-9000.svg?branch=master)](https://travis-ci.org/201-created/ember-data-hal-9000)
[![Code Climate](https://codeclimate.com/github/201-created/ember-data-hal-9000/badges/gpa.svg)](https://codeclimate.com/github/201-created/ember-data-hal-9000)

# Ember-data-hal-9000

An ember-data adapter for HAL-style APIs.
See the [IETF HAL Spec](https://tools.ietf.org/html/draft-kelly-json-hal-06) or [this HAL document](http://stateless.co/hal_specification.html) for more info on HAL.

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

## Running Tests

* `ember test`
* `ember test --server`
