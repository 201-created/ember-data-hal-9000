/* global QUnit */
import resolver from './helpers/resolver';
import {
  setResolver
} from 'ember-qunit';
import FakeServer from 'ember-cli-fake-server';

setResolver(resolver);

QUnit.testStart(function() {
  FakeServer.start();
});
QUnit.testDone(function() {
  FakeServer.stop();
});
