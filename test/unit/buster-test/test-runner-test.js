if (typeof require != "undefined") {
    var testCase = require("buster-util").testCase;
    var sys = require("sys");
    var sinon = require("sinon");

    var buster = {
        assert: require("buster-assert"),
        testCase: require("buster-test/test-case"),
        testCaseRunner: require("buster-test/test-runner").testCaseRunner,
        util: require("buster-util"),
        promise: require("buster-test/promise")
    };
}

testCase("TestRunnerRunTest", {
    setUp: function () {
        this.runner = buster.util.create(buster.testCaseRunner);
    },

    "should return promise": function () {
        var promise = this.runner.run();

        buster.assert.isObject(promise);
        buster.assert.isFunction(promise.then);
    },

    "should reject without context": function () {
        var rejection = sinon.spy();
        this.runner.run().then(function () {}, rejection);

        buster.assert(rejection.called);
    },

    "should run single test function": function (test) {
        var testFn = sinon.spy();
        var context = buster.testCase("Test", { test: testFn });

        this.runner.run(context).then(function () {
            buster.assert(testFn.calledOnce);
            buster.assert(testFn.calledOn(context.testCase));
            test.end();
        });
    },

    "should not reject if test throws": function (test) {
        var context = buster.testCase("Test", { test: sinon.stub().throws() });

        this.runner.run(context).then(function () {
            test.end();
        }, function () {
            buster.assert.fail();
        });
    },

    "should call setUp on test case object": function (test) {
        var setUp = sinon.spy();
        var context = buster.testCase("Test", { setUp: setUp, test: function () {} });

        this.runner.run(context).then(function () {
            buster.assert(setUp.calledOnce);
            buster.assert(setUp.calledOn(context.testCase));
            test.end();
        });
    },

    "should call setUp before test": function (test) {
        var testFn = sinon.spy();
        var setUp = sinon.spy();
        var context = buster.testCase("Test", { setUp: setUp, test: testFn });

        this.runner.run(context).then(function () {
            buster.assert(setUp.calledBefore(testFn));
            test.end();
        });
    },

    "should not reject if setUp fails": function (test) {
        var setUp = sinon.stub().throws();
        var context = buster.testCase("Test", { setUp: setUp, test: sinon.spy() });

        this.runner.run(context).then(function () {
            test.end();
        }, function () {
            buster.assert.fail();
        });
    },

    "should not call test if setUp throws": function (test) {
        var testFn = sinon.spy();
        var setUp = sinon.stub().throws();
        var context = buster.testCase("Test", { setUp: setUp, test: testFn });

        this.runner.run(context).then(function () {
            buster.assert(!testFn.called);
            test.end();
        });
    },

    "should call tearDown on test case object": function (test) {
        var testFn = sinon.spy();
        var tearDown = sinon.spy();
        var context = buster.testCase("Test", { tearDown: tearDown, test: testFn });

        this.runner.run(context).then(function () {
            buster.assert(tearDown.calledOnce);
            buster.assert(tearDown.calledOn(context.testCase));
            test.end();
        });
    },

    "should call tearDown after test": function (test) {
        var testFn = sinon.spy();
        var tearDown = sinon.spy();
        var context = buster.testCase("Test", { tearDown: tearDown, test: testFn });

        this.runner.run(context).then(function () {
            buster.assert(tearDown.calledAfter(testFn));
            test.end();
        });
    },

    "should not throw if tearDown throws": function (test) {
        var testFn = sinon.spy();
        var tearDown = sinon.stub().throws();
        var context = buster.testCase("Test", { tearDown: tearDown, test: testFn });

        this.runner.run(context).then(function () {
            test.end();
        }, function () {
            buster.assert.fail();
        });
    },

    "should call tearDown if setUp throws": function (test) {
        var tearDown = sinon.spy();

        var context = buster.testCase("Test", {
            setUp: sinon.stub().throws(), tearDown: tearDown, test: sinon.spy()
        });

        this.runner.run(context).then(function () {
            buster.assert(tearDown.calledOnce);
            test.end();
        });
    },

    "should call tearDown if test throws": function (test) {
        var tearDown = sinon.spy();

        var context = buster.testCase("Test", {
            setUp: sinon.spy(), tearDown: tearDown, test: sinon.stub().throws()
        });

        this.runner.run(context).then(function () {
            buster.assert(tearDown.calledOnce);
            test.end();
        });
    },

    "should run all tests": function (test) {
        var tests = [sinon.spy(), sinon.spy(), sinon.spy()];

        var context = buster.testCase("Test", {
            test1: tests[0], test2: tests[1], test3: tests[2]
        });

        this.runner.run(context).then(function () {
            buster.assert(tests[0].calledOnce);
            buster.assert(tests[1].calledOnce);
            buster.assert(tests[2].calledOnce);
            test.end();
        });
    },

    "should run all tests even if one fails": function (test) {
        var tests = [sinon.spy(), sinon.stub().throws(), sinon.spy()];

        var context = buster.testCase("Test", {
            test1: tests[0], test2: tests[1], test3: tests[2]
        });

        this.runner.run(context).then(function () {
            buster.assert(tests[0].calledOnce);
            buster.assert(tests[1].calledOnce);
            buster.assert(tests[2].calledOnce);
            test.end();
        });
    },

    "should run setUp once for each test": function (test) {
        var setUp = sinon.spy();
        var tests = [sinon.spy(), sinon.spy(), sinon.spy()];

        var context = buster.testCase("Test", {
            setUp: setUp,
            test1: tests[0], test2: tests[1], test3: tests[2]
        });

        this.runner.run(context).then(function () {
            buster.assert(setUp.calledThrice);
            buster.assert(setUp.calledBefore(tests[0]));
            buster.assert(setUp.calledAfter(tests[1]));
            buster.assert(!setUp.calledAfter(tests[2]));
            test.end();
        });
    },

    "should run tearDown once for each test": function (test) {
        var tearDown = sinon.spy();
        var tests = [sinon.spy(), sinon.spy(), sinon.spy()];

        var context = buster.testCase("Test", {
            tearDown: tearDown,
            test1: tests[0], test2: tests[1], test3: tests[2]
        });

        this.runner.run(context).then(function () {
            buster.assert(tearDown.calledThrice);
            buster.assert(!tearDown.calledBefore(tests[0]));
            buster.assert(tearDown.calledAfter(tests[0]));
            buster.assert(tearDown.calledAfter(tests[2]));
            test.end();
        });
    },

    "should run tests in sub context": function (test) {
        var testFn = sinon.spy();
        var context = buster.testCase("Test", { "context": { test1: testFn } });

        this.runner.run(context).then(function () {
            buster.assert(testFn.calledOnce);
            test.end();
        });
    },

    "should run tests in all sub contexts": function (test) {
        var tests = [sinon.spy(), sinon.spy()];

        var context = buster.testCase("Test", {
            "context": { test1: tests[0] },
            "context2": { test1: tests[1] }
        });

        this.runner.run(context).then(function () {
            buster.assert(tests[0].calledOnce);
            buster.assert(tests[1].calledOnce);
            test.end();
        });
    },

    "should run sub context setUp for test in sub context": function (test) {
        var setUp = sinon.spy();
        var testFn = sinon.spy();

        var context = buster.testCase("Test", {
            "context": { setUp: setUp, test1: testFn }
        });

        context.contexts()[0].testCase.id = 42;

        this.runner.run(context).then(function () {
            buster.assert(setUp.calledOnce);
            buster.assert(setUp.calledOn(context.contexts()[0].testCase));
            test.end();
        });
    },

    "should run parent setUp prior to local setUp": function (test) {
        var setUps = [sinon.spy(), sinon.spy()];
        var testFn = sinon.spy();

        var context = buster.testCase("Test", {
            setUp: setUps[0],
            "context": { setUp: setUps[1], test1: testFn }
        });

        this.runner.run(context).then(function () {
            buster.assert(setUps[0].calledOnce);
            buster.assert(setUps[1].calledOnce);
            buster.assert(setUps[0].calledBefore(setUps[1]));
            test.end();
        });
    },

    "should run parent setUp on local test case object": function (test) {
        var setUp = sinon.spy();

        var context = buster.testCase("Test", {
            setUp: setUp,
            "context": { test1: sinon.spy() }
        });

        this.runner.run(context).then(function () {
            buster.assert(setUp.calledOn(context.contexts()[0].testCase));
            test.end();
        });
    },

    "should stop running setUps if one fails": function (test) {
        var setUps = [sinon.stub().throws(), sinon.spy()];

        var context = buster.testCase("Test", {
            setUp: setUps[0],
            "context": { setUp: setUps[1], test1: sinon.spy() }
        });

        this.runner.run(context).then(function () {
            buster.assert(!setUps[1].called);
            test.end();
        });
    },

    "should run sub context tearDown for test in sub context": function (test) {
        var tearDown = sinon.spy();

        var context = buster.testCase("Test", {
            "context": { tearDown: tearDown, test1: sinon.spy() }
        });

        this.runner.run(context).then(function () {
            buster.assert(tearDown.calledOnce);
            buster.assert(tearDown.calledOn(context.contexts()[0].testCase));
            test.end();
        });
    },

    "should run parent tearDown after local tearDown": function (test) {
        var tearDowns = [sinon.spy(), sinon.spy()];

        var context = buster.testCase("Test", {
            tearDown: tearDowns[0],
            "context": { tearDown: tearDowns[1], test1: sinon.spy() }
        });

        this.runner.run(context).then(function () {
            buster.assert(tearDowns[0].calledOnce);
            buster.assert(tearDowns[0].calledOnce);
            buster.assert(tearDowns[1].calledOnce);
            buster.assert(tearDowns[0].calledAfter(tearDowns[1]));
            test.end();
        });
    },

    "should run parent tearDown on local test case object": function (test) {
        var tearDown = sinon.spy();

        var context = buster.testCase("Test", {
            tearDown: tearDown,
            "context": { test1: sinon.spy() }
        });

        this.runner.run(context).then(function () {
            buster.assert(tearDown.calledOn(context.contexts()[0].testCase));
            test.end();
        });
    },

    "should not stop running tearDowns if one fails": function (test) {
        var tearDowns = [sinon.spy(), sinon.stub().throws()];

        var context = buster.testCase("Test", {
            tearDown: tearDowns[0],
            "context": { tearDown: tearDowns[1], test1: sinon.spy() }
        });

        this.runner.run(context).then(function () {
            buster.assert(tearDowns[1].called);
            test.end();
        });
    }
});

testCase("TestRunnerRunSuiteTest", {
    setUp: function () {
        this.runner = buster.util.create(buster.testCaseRunner);
    },

    "should run all contexts": function (test) {
        var tests = [sinon.spy(), sinon.spy()];

        var contexts = [buster.testCase("Test", {
            test1: tests[0],
        }), buster.testCase("Test other", {
            test2: tests[1]
        })];

        this.runner.runSuite(contexts).then(function () {
            buster.assert(tests[0].calledOnce);
            buster.assert(tests[1].calledOnce);
            buster.assert(tests[1].calledAfter(tests[0]));
            test.end();
        });
    }
});

function runnerEventsSetUp() {
    this.runner = buster.util.create(buster.testCaseRunner);
    this.runner.failOnNoAssertions = false;
    this.assertionError = new Error("Oh, crap");
    this.assertionError.name = "AssertionError";

    this.listeners = {
        "suite:start": sinon.spy(),
        "context:start": sinon.spy(),
        "test:setUp": sinon.spy(),
        "test:start": sinon.spy(),
        "test:tearDown": sinon.spy(),
        "test:failure": sinon.spy(),
        "test:error": sinon.spy(),
        "test:success": sinon.spy(),
        "context:end": sinon.spy(),
        "suite:end": sinon.spy()
    };

    this.runner.on("suite:start", this.listeners["suite:start"]);
    this.runner.on("context:start", this.listeners["context:start"]);
    this.runner.on("test:setUp", this.listeners["test:setUp"]);
    this.runner.on("test:start", this.listeners["test:start"]);
    this.runner.on("test:tearDown", this.listeners["test:tearDown"]);
    this.runner.on("test:success", this.listeners["test:success"]);
    this.runner.on("test:failure", this.listeners["test:failure"]);
    this.runner.on("test:error", this.listeners["test:error"]);
    this.runner.on("context:end", this.listeners["context:end"]);
    this.runner.on("suite:end", this.listeners["suite:end"]);

    this.myCase = buster.testCase("My case", {});
    this.otherCase = buster.testCase("Other", {});
    this.simpleCase = buster.testCase("One test", {
        setUp: sinon.spy(),
        tearDown: sinon.spy(),
        testIt: sinon.spy()
    });
}

testCase("TestRunnerEventsTest", {
    setUp: runnerEventsSetUp,

    "should emit event when starting suite": function (test) {
        var listener = this.listeners["suite:start"];

        this.runner.runSuite([this.myCase]).then(function () {
            buster.assert(listener.calledOnce);
            test.end();
        });
    },

    "should emit event when starting suite only once": function (test) {
        var listener = this.listeners["suite:start"];

        this.runner.runSuite([this.myCase, this.otherCase]).then(function () {
            buster.assert(listener.calledOnce);
            test.end();
        });
    },

    "should emit end suite event after context end": function (test) {
        var suite = this.listeners["suite:end"];
        var context = this.listeners["context:end"];

        this.runner.runSuite([this.myCase]).then(function () {
            buster.assert(suite.calledOnce);
            buster.assert(suite.calledAfter(context));
            test.end();
        });
    },

    "should emit event when starting context": function (test) {
        var listener = this.listeners["context:start"];

        this.runner.run(this.myCase).then(function () {
            buster.assert(listener.calledOnce);
            test.end();
        });
    },

    "should emit end context event after start context": function (test) {
        var start = this.listeners["context:start"];
        var end = this.listeners["context:end"];

        this.runner.run(this.myCase).then(function () {
            buster.assert(end.calledOnce);
            buster.assert(end.calledAfter(start));
            test.end();
        });
    },

    "should emit event when starting test": function (test) {
        var listener = this.listeners["test:start"];

        this.runner.run(this.simpleCase).then(function () {
            buster.assert(listener.calledOnce);
            test.end();
        });
    },

    "should emit setUp event before test:start": function (test) {
        var setUpListener = this.listeners["test:setUp"];
        var startListener = this.listeners["test:start"];

        this.runner.run(this.simpleCase).then(function () {
            buster.assert(setUpListener.calledOnce);
            buster.assert(setUpListener.calledBefore(startListener));
            test.end();
        });
    },

    "should emit tearDown event after test:start": function (test) {
        var tearDownListener = this.listeners["test:tearDown"];
        var startListener = this.listeners["test:start"];

        this.runner.run(this.simpleCase).then(function () {
            buster.assert(tearDownListener.calledOnce);
            buster.assert(tearDownListener.calledAfter(startListener));
            test.end();
        });
    },

    "should emit test:success when test passes": function (test) {
        var success = this.listeners["test:success"];

        this.runner.run(this.simpleCase).then(function () {
            buster.assert(success.calledOnce);
            test.end();
        });
    },

    "should not emit test:success if setUp throws": function (test) {
        var listener = this.listeners["test:success"];

        var context = buster.testCase("My case", {
            setUp: sinon.stub().throws(), testIt: sinon.spy()
        });

        this.runner.run(context).then(function () {
            buster.assert(!listener.called);
            test.end();
        });
    },

    "should not emit test:success if test throws": function (test) {
        var listener = this.listeners["test:success"];

        var context = buster.testCase("My case", {
            setUp: sinon.spy(), testIt: sinon.stub().throws()
        });

        this.runner.run(context).then(function () {
            buster.assert(!listener.called);
            test.end();
        });
    },

    "should not emit test:success if tearDown throws": function (test) {
        var listener = this.listeners["test:success"];

        var context = buster.testCase("My case", {
            tearDown: sinon.stub().throws(), testIt: sinon.spy()
        });

        this.runner.run(context).then(function () {
            buster.assert(!listener.called);
            test.end();
        });
    },

    "should emit test:fail when test throws assertion error": function (test) {
        var testFn = sinon.stub().throws(this.assertionError);
        var context = buster.testCase("My case", { testIt: testFn });
        var listener = this.listeners["test:failure"];

        this.runner.run(context).then(function () {
            buster.assert(listener.calledOnce);
            test.end();
        });
    },

    "should emit test:fail if setUp throws assertion error": function (test) {
        var listener = this.listeners["test:failure"];

        var context = buster.testCase("My case", {
            setUp: sinon.stub().throws(this.assertionError), testIt: sinon.spy()
        });

        this.runner.run(context).then(function () {
            buster.assert(listener.calledOnce);
            test.end();
        });
    },

    "should not emit test:fail if test passes": function (test) {
        var listener = this.listeners["test:failure"];

        var context = buster.testCase("My case", {
            setUp: sinon.spy(),
            testIt: sinon.stub()
        });

        this.runner.run(context).then(function () {
            buster.assert(!listener.called);
            test.end();
        });
    },

    "should emit test:fail if tearDown throws assertion error": function (test) {
        var listener = this.listeners["test:failure"];

        var context = buster.testCase("My case", {
            tearDown: sinon.stub().throws(this.assertionError), testIt: sinon.spy()
        });

        this.runner.run(context).then(function () {
            buster.assert(listener.calledOnce);
            test.end();
        });
    },

    "should emit test:error when test throws": function (test) {
        var listener = this.listeners["test:error"];
        var testFn = sinon.stub().throws(new Error("Oops"));
        var context = buster.testCase("My case", { testIt: testFn });

        this.runner.run(context).then(function () {
            buster.assert(listener.calledOnce);
            test.end();
        });
    },

    "should emit test:error if setUp throws": function (test) {
        var errorListener = this.listeners["test:error"];
        var failureListener = this.listeners["test:failure"];

        var context = buster.testCase("My case", {
            setUp: sinon.stub().throws(), testIt: sinon.spy()
        });

        this.runner.run(context).then(function () {
            buster.assert(errorListener.calledOnce);
            buster.assert(!failureListener.called);
            test.end();
        });
    },

    "should not emit test:error if test passes": function (test) {
        var listener = this.listeners["test:error"];

        var context = buster.testCase("My case", {
            setUp: sinon.spy(), testIt: sinon.stub()
        });

        this.runner.run(context).then(function () {
            buster.assert(!listener.called);
            test.end();
        });
    },

    "should emit test:error if tearDown throws assertion error": function (test) {
        var errorListener = this.listeners["test:error"];
        var failureListener = this.listeners["test:failure"];

        var context = buster.testCase("My case", {
            tearDown: sinon.stub().throws(), testIt: sinon.spy()
        });

        this.runner.run(context).then(function () {
            buster.assert(errorListener.calledOnce);
            buster.assert(!failureListener.called);
            test.end();
        });
    }
// });

// testCase("TestRunnerEventDataTest", {
//     setUp: runnerEventsSetUp,

//     "context:start event data": function (test) {
//         var context = buster.testCase("My case", {});

//         this.runner.run(context);
//         var args = this.listeners["context:start"].args[0];

//         buster.assert.equals(args, [context]);
//     },

//     "context:end event data": function (test) {
//         var context = buster.testCase("My case", {});

//         this.runner.run(context);
//         var args = this.listeners["context:end"].args[0];

//         buster.assert.equals(args, [context]);
//     },

//     "test:setUp event data": function (test) {
//         var context = buster.testCase("My case", {
//             setUp: function () {}, test1: function () {}
//         });

//         this.runner.run(context);
//         var args = this.listeners["test:setUp"].args[0];

//         buster.assert.equals(args, [{
//             name: "test1"
//         }]);
//     },

//     "test:tearDown event data": function (test) {
//         var context = buster.testCase("My case", {
//             setUp: function () {}, test1: function () {}
//         });

//         this.runner.run(context);
//         var args = this.listeners["test:tearDown"].args[0];

//         buster.assert.equals(args, [{
//             name: "test1"
//         }]);
//     },

//     "test:start event data": function (test) {
//         var context = buster.testCase("My case", {
//             setUp: function () {}, test1: function () {}
//         });

//         this.runner.run(context);
//         var args = this.listeners["test:start"].args[0];

//         buster.assert.equals(args, [{
//             name: "test1"
//         }]);
//     },

//     "test:error event data": function (test) {
//         var context = buster.testCase("My case", {
//             setUp: function () {}, test1: sinon.stub().throws("TypeError")
//         });

//         this.runner.run(context);
//         var args = this.listeners["test:error"].args[0];

//         buster.assert.equals("test1", args[0].name);
//         buster.assert.equals("TypeError", args[0].error.name);
//         buster.assert.equals("", args[0].error.message);
//         buster.assert.match(/\.js/, args[0].error.stack);
//     },

//     "test:fail event data": function (test) {
//         var context = buster.testCase("My case", {
//             setUp: function () {}, test1: sinon.stub().throws("AssertionError")
//         });

//         this.runner.run(context);
//         var args = this.listeners["test:failure"].args[0];

//         buster.assert.equals("test1", args[0].name);
//         buster.assert.equals("AssertionError", args[0].error.name);
//         buster.assert.equals("", args[0].error.message);
//         buster.assert.match(/\.js/, args[0].error.stack);
//     },

//     "test:success event data": function (test) {
//         var context = buster.testCase("My case", {
//             setUp: function () {}, test1: sinon.spy()
//         });

//         sinon.stub(this.runner, "assertionCount").returns(2);
//         this.runner.run(context);
//         var args = this.listeners["test:success"].args[0];

//         buster.assert.equals([{
//             name: "test1",
//             assertions: 2
//         }], args);
//     },

//     "suite:end event data": function (test) {
//         var context = buster.testCase("My case", {
//             setUp: function () {},
//             test1: sinon.spy(),
//             test2: sinon.stub().throws(),
//             test3: sinon.spy(),
//             test4: sinon.stub().throws("AssertionError"),
//             inner: {
//                 test5: sinon.spy()
//             }
//         });

//         sinon.stub(this.runner, "assertionCount").returns(2);
//         this.runner.runSuite([context, context]);
//         var args = this.listeners["suite:end"].args[0];

//         buster.assert.equals([{
//             contexts: 2,
//             tests: 10,
//             failures: 2,
//             errors: 2,
//             assertions: 12,
//             ok: true
//         }], args);
//     }
// });

// testCase("TestRunnerAssertionCountTest", {
//     setUp: function () {
//         this.context = buster.testCase("Test + Assertions", {
//             test1: function () {}
//         });

//         this.runner = buster.util.create(buster.testRunner);
//         this.listener = sinon.spy();
//         this.runner.on("test:failure", this.listener);
//     },

//     "should fail test if 0 assertions": function (test) {
//         sinon.stub(this.runner, "assertionCount").returns(0);

//         this.runner.run(this.context);

//         buster.assert(this.listener.calledOnce);
//     },

//     "should not fail test if 1 assertion": function (test) {
//         sinon.stub(this.runner, "assertionCount").returns(1);

//         this.runner.run(this.context);

//         buster.assert(!this.listener.called);
//     },

//     "should configure to not fail test if 0 assertions": function (test) {
//         sinon.stub(this.runner, "assertionCount").returns(0);

//         this.runner.failOnNoAssertions = false;
//         this.runner.run(this.context);

//         buster.assert(!this.listener.called);
//     },

//     "should fail for unexpected number of assertions": function (test) {
//         sinon.stub(this.runner, "assertionCount").returns(3);

//         var context = buster.testCase("Test Assertions", {
//             test1: function () {
//                 this.expectedAssertions = 2;
//             }
//         });

//         this.runner.run(context);

//         buster.assert(this.listener.calledOnce);
//         buster.assert.equals("Expected 2 assertions, ran 3",
//                              this.listener.args[0][0].error.message);
//     },

//     "should only check expected assertions for tests that explicitly define it": function (test) {
//         sinon.stub(this.runner, "assertionCount").returns(3);

//         var context = buster.testCase("Test Assertions", {
//             test1: function () {
//                 this.expectedAssertions = 2;
//             },

//             test2: function () {}
//         });

//         this.runner.run(context);

//         buster.assert(this.listener.calledOnce);
//         buster.assert.equals("test1", this.listener.args[0][0].name);
//     },

//     "should clear expected assertions when test fails for other reasons": function (test) {
//         sinon.stub(this.runner, "assertionCount").returns(3);
//         this.runner.on("test:error", this.listener);

//         var context = buster.testCase("Test Assertions", {
//             test1: function () {
//                 this.expectedAssertions = 2;
//                 throw new Error();
//             },

//             test2: function () {}
//         });

//         this.runner.run(context);

//         buster.assert(this.listener.calledOnce);
//         buster.assert.equals("test1", this.listener.args[0][0].name);
//     }
});

// testCase("TestRunnerAsyncTest", {
//     setUp: function () {
//         this.runner = buster.util.create(buster.testCaseRunner);
//     },

//     "should call test asynchronously": function (test) {
//         var testFn = sinon.spy();
//         var context = buster.testCase("Test", { test: testFn });

//         this.runner.run(context).then(function () {
//             buster.assert(testFn.called);
//             test.end();
//         });

//         buster.assert(!testFn.called);
//     },

//     "should resolve run when test has resolved": function (test) {
//         var promise = buster.promise.create();
//         var testFn = sinon.stub().returns(promise);
//         var context = buster.testCase("Test", { test: testFn });
//         var runnerResolution = sinon.spy();

//         this.runner.run(context).then(runnerResolution);

//         buster.util.nextTick(function () {
//             buster.assert(!runnerResolution.called);
//             promise.resolve();
//             buster.assert(runnerResolution.called);
//             test.end();
//         });
//     }
// });
