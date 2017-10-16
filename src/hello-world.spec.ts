import { HelloWorld } from './hello-world';

describe('HelloWorld', () => {
  describe('#greetMe', () => {
    it('greets a person', () => {
      const greet = HelloWorld.greetMe('bersling')
      expect(greet).toEqual('Hi bersling!');
    })
  })
})

