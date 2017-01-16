import test from 'ava'
import * as p from './index'

test('head', t => {
  const list = [1,2,3]
  let stream = new p.Stream(list)
  t.is(stream.head(), 1)
  stream = stream.move(1)
  t.is(stream.head(), 2)
  stream = stream.move(1)
  t.is(stream.head(), 3)
  stream = stream.move(1)
  t.throws(() => stream.head())
})

test('cursor', t => {
  const list = [1,2,3]
  let stream = new p.Stream(list, 1)
  t.is(stream.head(), 2)
  stream = stream.move(1)
  t.is(stream.head(), 3)
  stream = stream.move(1)
})

test('cursor and length', t => {
  const list = [1,2,3]
  let stream = new p.Stream(list, 1, 1)
  t.is(stream.head(), 2)
  stream = stream.move(1)
  t.throws(() => stream.head())
})

test('move', t => {
  const list = [1,2,3]
  let stream = new p.Stream(list)
  t.is(stream.head(), 1)
  stream = stream.move(2)
  t.is(stream.head(), 3)
})

test('slice', t => {
  const list = [1,2,3,4,5]
  let stream = new p.Stream(list)
  stream = stream.slice(1, 3)
  t.is(stream.head(), 2)
  stream = stream.move(1)
  t.is(stream.head(), 3)
  stream = stream.move(1)
  t.throws(() => stream.head())
})
