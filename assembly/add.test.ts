import {
  test,
  expect,
  endTest,
} from 'assemblyscript-unittest-framework/assembly';
import { add } from './add';

test('sum', () => {
  expect(add(1, 2)).equal(3);
  expect(add(1, 1)).equal(3);
});
endTest(); // Don't forget it!
