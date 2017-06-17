"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var HelloWorld;
(function (HelloWorld) {
    function sayHello() {
        console.log('hi');
    }
    HelloWorld.sayHello = sayHello;
    function sayGoodbye() {
        console.log('goodbye');
    }
    HelloWorld.sayGoodbye = sayGoodbye;
})(HelloWorld = exports.HelloWorld || (exports.HelloWorld = {}));
