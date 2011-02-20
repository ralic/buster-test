if (typeof require != "undefined") {
    var testCase = require("buster-util").testCase;
    var sys = require("sys");
    var sinon = require("sinon");
    var sys = require("sys"); 

    var buster = {
        assert: require("buster-assert"),
        testCase: require("buster-test/test-case"),
        testRunner: require("buster-test/test-runner"),
        util: require("buster-util")
    };
}

testCase("TestRunnerRunTest", {
    setUp: function () {
        this.runner = buster.util.create(buster.testRunner);
    },

    "should throw without context": function () {
        var runner = this.runner;

        buster.assert.exception(function () {
            runner.run();
        }, "TypeError");
    },

    "should run single test function": function () {
        var test = sinon.spy();
        var context = buster.testCase("Test", { test: test });

        this.runner.run(context);

        buster.assert(test.calledOnce);
        buster.assert(test.calledOn(context.testCase));
    },

    "should not throw if test throws": function () {
        var test = sinon.stub().throws();
        var context = buster.testCase("Test", { test: test });
        var runner = this.runner;

        buster.assert.noException(function () {
            runner.run(context);
        });
    },

    "should call setUp on test case object": function () {
        var setUp = sinon.spy();
        var context = buster.testCase("Test", { setUp: setUp, test: function () {} });

        this.runner.run(context);

        buster.assert(setUp.calledOnce);
        buster.assert(setUp.calledOn(context.testCase));
    },

    "should call setUp before test": function () {
        var test = sinon.spy();
        var setUp = sinon.spy();
        var context = buster.testCase("Test", { setUp: setUp, test: test });

        this.runner.run(context);

        buster.assert(setUp.calledBefore(test));
    },

    "should not throw if setUp fails": function () {
        var test = sinon.spy();
        var setUp = sinon.stub().throws();
        var context = buster.testCase("Test", { setUp: setUp, test: test });
        var runner = this.runner;

        buster.assert.noException(function () {
            runner.run(context);
        });
    },

    "should not call test if setUp throws": function () {
        var test = sinon.spy();
        var setUp = sinon.stub().throws();
        var context = buster.testCase("Test", { setUp: setUp, test: test });

        this.runner.run(context);

        buster.assert(!test.called);
    },

    "should call tearDown on test case object": function () {
        var test = sinon.spy();
        var tearDown = sinon.spy();
        var context = buster.testCase("Test", { tearDown: tearDown, test: test });

        this.runner.run(context);

        buster.assert(tearDown.calledOnce);
        buster.assert(tearDown.calledOn(context.testCase));
    },

    "should call tearDown after test": function () {
        var test = sinon.spy();
        var tearDown = sinon.spy();
        var context = buster.testCase("Test", { tearDown: tearDown, test: test });

        this.runner.run(context);

        buster.assert(tearDown.calledAfter(test));
    },

    "should not throw if tearDown throws": function () {
        var test = sinon.spy();
        var tearDown = sinon.stub().throws();
        var context = buster.testCase("Test", { tearDown: tearDown, test: test });
        var runner = this.runner;

        buster.assert.noException(function () {
            runner.run(context);
        });
    },

    "should call tearDown if setUp throws": function () {
        var test = sinon.spy();
        var setUp = sinon.stub().throws();
        var tearDown = sinon.spy();
        var context = buster.testCase("Test", {
            setUp: setUp, tearDown: tearDown, test: test
        });


        this.runner.run(context);

        buster.assert(tearDown.calledOnce);
    },

    "should call tearDown if test throws": function () {
        var test = sinon.stub().throws();
        var setUp = sinon.spy();
        var tearDown = sinon.spy();
        var context = buster.testCase("Test", {
            setUp: setUp, tearDown: tearDown, test: test
        });

        this.runner.run(context);

        buster.assert(tearDown.calledOnce);
    },

    "should run all tests": function () {
        var tests = [sinon.spy(), sinon.spy(), sinon.spy()];

        var context = buster.testCase("Test", {
            test1: tests[0], test2: tests[1], test3: tests[2]
        });

        this.runner.run(context);

        buster.assert(tests[0].calledOnce);
        buster.assert(tests[1].calledOnce);
        buster.assert(tests[2].calledOnce);
    },

    "should run all tests even if one fails": function () {
        var tests = [sinon.spy(), sinon.stub().throws(), sinon.spy()];

        var context = buster.testCase("Test", {
            test1: tests[0], test2: tests[1], test3: tests[2]
        });

        this.runner.run(context);

        buster.assert(tests[0].calledOnce);
        buster.assert(tests[1].calledOnce);
        buster.assert(tests[2].calledOnce);
    },

    "should run setUp once for each test": function () {
        var setUp = sinon.spy();
        var tests = [sinon.spy(), sinon.spy(), sinon.spy()];

        var context = buster.testCase("Test", {
            setUp: setUp,
            test1: tests[0], test2: tests[1], test3: tests[2]
        });

        this.runner.run(context);

        buster.assert(setUp.calledThrice);
        buster.assert(setUp.calledBefore(tests[0]));
        buster.assert(setUp.calledAfter(tests[1]));
        buster.assert(!setUp.calledAfter(tests[2]));
    },

    "should run tearDown once for each test": function () {
        var tearDown = sinon.spy();
        var tests = [sinon.spy(), sinon.spy(), sinon.spy()];

        var context = buster.testCase("Test", {
            tearDown: tearDown,
            test1: tests[0], test2: tests[1], test3: tests[2]
        });

        this.runner.run(context);

        buster.assert(tearDown.calledThrice);
        buster.assert(!tearDown.calledBefore(tests[0]));
        buster.assert(tearDown.calledAfter(tests[0]));
        buster.assert(tearDown.calledAfter(tests[2]));
    },

    "should run tests in sub context": function () {
        var test = sinon.spy();
        var context = buster.testCase("Test", { "context": { test1: test } });

        this.runner.run(context);

        buster.assert(test.calledOnce);
    },

    "should run tests in all sub contexts": function () {
        var tests = [sinon.spy(), sinon.spy()];

        var context = buster.testCase("Test", {
            "context": { test1: tests[0] },
            "context2": { test1: tests[1] }
        });

        this.runner.run(context);

        buster.assert(tests[0].calledOnce);
        buster.assert(tests[1].calledOnce);
    },

    "should run sub context setUp for test in sub context": function () {
        var setUp = sinon.spy();
        var test = sinon.spy();

        var context = buster.testCase("Test", {
            "context": { setUp: setUp, test1: test }
        });

        context.contexts()[0].testCase.id = 42;

        this.runner.run(context);

        buster.assert(setUp.calledOnce);
        buster.assert(setUp.calledOn(context.contexts()[0].testCase));
    },

    "should run parent setUp prior to local setUp": function () {
        var setUps = [sinon.spy(), sinon.spy()];
        var test = sinon.spy();

        var context = buster.testCase("Test", {
            setUp: setUps[0],
            "context": { setUp: setUps[1], test1: test }
        });

        this.runner.run(context);

        buster.assert(setUps[0].calledOnce);
        buster.assert(setUps[0].calledOnce);
        buster.assert(setUps[1].calledOnce);
        buster.assert(setUps[0].calledBefore(setUps[1]));
    },

    "should run parent setUp on local test case object": function () {
        var setUp = sinon.spy();
        var test = sinon.spy();

        var context = buster.testCase("Test", {
            setUp: setUp,
            "context": { test1: test }
        });

        this.runner.run(context);

        buster.assert(setUp.calledOn(context.contexts()[0].testCase));
    },

    "should stop running setUps if one fails": function () {
        var setUps = [sinon.stub().throws(), sinon.spy()];
        var test = sinon.spy();

        var context = buster.testCase("Test", {
            setUp: setUps[0],
            "context": { setUp: setUps[1], test1: test }
        });

        this.runner.run(context);

        buster.assert(!setUps[1].called);
    },

    "should run sub context tearDown for test in sub context": function () {
        var tearDown = sinon.spy();
        var test = sinon.spy();

        var context = buster.testCase("Test", {
            "context": { tearDown: tearDown, test1: test }
        });

        context.contexts()[0].testCase.id = 42;

        this.runner.run(context);

        buster.assert(tearDown.calledOnce);
        buster.assert(tearDown.calledOn(context.contexts()[0].testCase));
    },

    "should run parent tearDown after local tearDown": function () {
        var tearDowns = [sinon.spy(), sinon.spy()];
        var test = sinon.spy();

        var context = buster.testCase("Test", {
            tearDown: tearDowns[0],
            "context": { tearDown: tearDowns[1], test1: test }
        });

        this.runner.run(context);

        buster.assert(tearDowns[0].calledOnce);
        buster.assert(tearDowns[0].calledOnce);
        buster.assert(tearDowns[1].calledOnce);
        buster.assert(tearDowns[0].calledAfter(tearDowns[1]));
    },

    "should run parent tearDown on local test case object": function () {
        var tearDown = sinon.spy();
        var test = sinon.spy();

        var context = buster.testCase("Test", {
            tearDown: tearDown,
            "context": { test1: test }
        });

        this.runner.run(context);

        buster.assert(tearDown.calledOn(context.contexts()[0].testCase));
    },

    "should not stop running tearDowns if one fails": function () {
        var tearDowns = [sinon.spy(), sinon.stub().throws()];
        var test = sinon.spy();

        var context = buster.testCase("Test", {
            tearDown: tearDowns[0],
            "context": { tearDown: tearDowns[1], test1: test }
        });

        this.runner.run(context);

        buster.assert(tearDowns[1].called);
    }
});

function runnerEventsSetUp() {
    this.runner = buster.util.create(buster.testRunner);
    this.assertionError = new Error("Oh, crap");
    this.assertionError.name = "AssertionError";

    this.listeners = {
        "context:start": sinon.spy(),
        "test:setUp": sinon.spy(),
        "test:start": sinon.spy(),
        "test:tearDown": sinon.spy(),
        "test:fail": sinon.spy(),
        "test:error": sinon.spy(),
        "test:success": sinon.spy(),
        "context:end": sinon.spy()
    };

    this.runner.on("context:start", this.listeners["context:start"]);
    this.runner.on("test:setUp", this.listeners["test:setUp"]);
    this.runner.on("test:start", this.listeners["test:start"]);
    this.runner.on("test:tearDown", this.listeners["test:tearDown"]);
    this.runner.on("test:success", this.listeners["test:success"]);
    this.runner.on("test:fail", this.listeners["test:fail"]);
    this.runner.on("test:error", this.listeners["test:error"]);
    this.runner.on("context:end", this.listeners["context:end"]);
}

testCase("TestRunnerEventsTest", {
    setUp: runnerEventsSetUp,

    "should emit event when starting context": function () {
        var context = buster.testCase("My case", {});
        this.runner.run(context);
        var listener = this.listeners["context:start"];

        buster.assert(listener.calledOnce);
        buster.assert(listener.calledWith(context));
    },

    "should emit end context event after start context": function () {
        this.runner.run(buster.testCase("My case", {}));

        buster.assert(this.listeners["context:end"].calledOnce);
        buster.assert(this.listeners["context:end"].calledAfter(this.listeners["context:start"]));
    },

    "should emit event when starting test": function () {
        var listener = this.listeners["test:start"];
        var test = sinon.spy();
        var context = buster.testCase("My case", { testIt: test });

        this.runner.run(context);

        buster.assert(listener.calledOnce);
    },

    "should emit setUp event before test:start": function () {
        var test = sinon.spy(), setUp = sinon.spy();
        var context = buster.testCase("My case", { setUp: setUp, testIt: test });

        this.runner.run(context);

        buster.assert(this.listeners["test:setUp"].calledOnce);
        buster.assert(this.listeners["test:setUp"].calledBefore(this.listeners["test:start"]));
    },

    "should emit tearDown event after test:start": function () {
        var test = sinon.spy(), tearDown = sinon.spy();
        var context = buster.testCase("My case", { tearDown: tearDown, testIt: test });

        this.runner.run(context);

        buster.assert(this.listeners["test:tearDown"].calledOnce);
        buster.assert(this.listeners["test:tearDown"].calledAfter(this.listeners["test:start"]));
    },

    "should emit test:success when test passes": function () {
        var test = sinon.spy();
        var context = buster.testCase("My case", { testIt: test });

        this.runner.run(context);

        buster.assert(this.listeners["test:success"].calledOnce);
    },

    "should not emit test:success if setUp throws": function () {
        var context = buster.testCase("My case", {
            setUp: sinon.stub().throws(), testIt: sinon.spy()
        });

        this.runner.run(context);

        buster.assert(!this.listeners["test:success"].called);
    },

    "should not emit test:success if test throws": function () {
        var context = buster.testCase("My case", {
            setUp: sinon.spy(), testIt: sinon.stub().throws()
        });

        this.runner.run(context);

        buster.assert(!this.listeners["test:success"].called);
    },

    "should not emit test:success if tearDown throws": function () {
        var context = buster.testCase("My case", {
            tearDown: sinon.stub().throws(), testIt: sinon.spy()
        });

        this.runner.run(context);

        buster.assert(!this.listeners["test:success"].called);
    },

    "should emit test:fail when test throws assertion error": function () {
        var test = sinon.stub().throws(this.assertionError);
        var context = buster.testCase("My case", { testIt: test });

        this.runner.run(context);

        buster.assert(this.listeners["test:fail"].calledOnce);
    },

    "should emit test:fail if setUp throws assertion error": function () {
        var context = buster.testCase("My case", {
            setUp: sinon.stub().throws(this.assertionError), testIt: sinon.spy()
        });

        this.runner.run(context);

        buster.assert(this.listeners["test:fail"].calledOnce);
    },

    "should not emit test:fail if test passes": function () {
        var context = buster.testCase("My case", {
            setUp: sinon.spy(), testIt: sinon.stub()
        });

        this.runner.run(context);

        buster.assert(!this.listeners["test:fail"].called);
    },

    "should emit test:fail if tearDown throws assertion error": function () {
        var context = buster.testCase("My case", {
            tearDown: sinon.stub().throws(this.assertionError), testIt: sinon.spy()
        });

        this.runner.run(context);

        buster.assert(this.listeners["test:fail"].calledOnce);
    },

    "should emit test:error when test throws": function () {
        var error = new Error("Oops");
        var test = sinon.stub().throws(error);
        var context = buster.testCase("My case", { testIt: test });

        this.runner.run(context);

        buster.assert(this.listeners["test:error"].calledOnce);
    },

    "should emit test:error if setUp throws": function () {
        var context = buster.testCase("My case", {
            setUp: sinon.stub().throws(), testIt: sinon.spy()
        });

        this.runner.run(context);

        buster.assert(this.listeners["test:error"].calledOnce);
        buster.assert(!this.listeners["test:fail"].calledOnce);
    },

    "should not emit test:error if test passes": function () {
        var context = buster.testCase("My case", {
            setUp: sinon.spy(), testIt: sinon.stub()
        });

        this.runner.run(context);

        buster.assert(!this.listeners["test:error"].called);
    },

    "should emit test:error if tearDown throws assertion error": function () {
        var context = buster.testCase("My case", {
            tearDown: sinon.stub().throws(), testIt: sinon.spy()
        });

        this.runner.run(context);

        buster.assert(this.listeners["test:error"].calledOnce);
        buster.assert(!this.listeners["test:fail"].calledOnce);
    }
});

testCase("TestRunnerEventContentTest", {
    setUp: runnerEventsSetUp,

    "context:start event data": function () {
        var context = buster.testCase("My case", {});

        this.runner.run(context);
        var args = this.listeners["context:start"].args[0];

        buster.assert.equals(args, [context]);
    },

    "context:end event data": function () {
        var context = buster.testCase("My case", {});

        this.runner.run(context);
        var args = this.listeners["context:end"].args[0];

        buster.assert.equals(args, [context]);
    },

    "test:setUp event data": function () {
        var context = buster.testCase("My case", {
            setUp: function () {}, test1: function () {}
        });

        this.runner.run(context);
        var args = this.listeners["test:setUp"].args[0];

        buster.assert.equals(args, [{
            name: "test1"
        }]);
    },

    "test:tearDown event data": function () {
        var context = buster.testCase("My case", {
            setUp: function () {}, test1: function () {}
        });

        this.runner.run(context);
        var args = this.listeners["test:tearDown"].args[0];

        buster.assert.equals(args, [{
            name: "test1"
        }]);
    },

    "test:start event data": function () {
        var context = buster.testCase("My case", {
            setUp: function () {}, test1: function () {}
        });

        this.runner.run(context);
        var args = this.listeners["test:start"].args[0];

        buster.assert.equals(args, [{
            name: "test1"
        }]);
    },

    "test:error event data": function () {
        var context = buster.testCase("My case", {
            setUp: function () {}, test1: sinon.stub().throws("TypeError")
        });

        this.runner.run(context);
        var args = this.listeners["test:error"].args[0];

        buster.assert.equals("test1", args[0].name);
        buster.assert.equals("TypeError", args[0].error.name);
        buster.assert.equals("", args[0].error.message);
        buster.assert.match(/\.js/, args[0].error.stack);
    },

    "test:fail event data": function () {
        var context = buster.testCase("My case", {
            setUp: function () {}, test1: sinon.stub().throws("AssertionError")
        });

        this.runner.run(context);
        var args = this.listeners["test:fail"].args[0];

        buster.assert.equals("test1", args[0].name);
        buster.assert.equals("AssertionError", args[0].error.name);
        buster.assert.equals("", args[0].error.message);
        buster.assert.match(/\.js/, args[0].error.stack);
    },

    "test:success event data": function () {
        var context = buster.testCase("My case", {
            setUp: function () {}, test1: sinon.spy()
        });

        sinon.stub(this.runner, "assertionCount").returns(2);
        this.runner.run(context);
        var args = this.listeners["test:success"].args[0];

        buster.assert.equals([{
            name: "test1",
            assertions: 2
        }], args);
    }
});

testCase("TestRunnerAssertionCountTest", {
    setUp: function () {
        this.context = buster.testCase("Test + Assertions", {
            test1: function () {}
        });

        this.runner = buster.util.create(buster.testRunner);
        this.listener = sinon.spy();
        this.runner.on("test:fail", this.listener);
    },

    "should fail test if 0 assertions": function () {
        sinon.stub(this.runner, "assertionCount").returns(0);

        this.runner.run(this.context);

        buster.assert(this.listener.calledOnce);
    },

    "should not fail test if 1 assertion": function () {
        sinon.stub(this.runner, "assertionCount").returns(1);

        this.runner.run(this.context);

        buster.assert(!this.listener.called);
    },

    "should configure to not fail test if 0 assertions": function () {
        sinon.stub(this.runner, "assertionCount").returns(0);

        this.runner.failOnNoAssertions = false;
        this.runner.run(this.context);

        buster.assert(!this.listener.called);
    },

    "should fail for unexpected number of assertions": function () {
        sinon.stub(this.runner, "assertionCount").returns(3);

        var context = buster.testCase("Test Assertions", {
            test1: function () {
                this.expectedAssertions = 2;
            }
        });

        this.runner.run(context);

        buster.assert(this.listener.calledOnce);
        buster.assert.equals("Expected 2 assertions, ran 3",
                             this.listener.args[0][0].error.message);
    },

    "should only check expected assertions for tests that explicitly define it": function () {
        sinon.stub(this.runner, "assertionCount").returns(3);

        var context = buster.testCase("Test Assertions", {
            test1: function () {
                this.expectedAssertions = 2;
            },

            test2: function () {}
        });

        this.runner.run(context);

        buster.assert(this.listener.calledOnce);
        buster.assert.equals("test1", this.listener.args[0][0].name);
    },

    "should clear expected assertions when test fails for other reasons": function () {
        sinon.stub(this.runner, "assertionCount").returns(3);
        this.runner.on("test:error", this.listener);

        var context = buster.testCase("Test Assertions", {
            test1: function () {
                this.expectedAssertions = 2;
                throw new Error();
            },

            test2: function () {}
        });

        this.runner.run(context);

        buster.assert(this.listener.calledOnce);
        buster.assert.equals("test1", this.listener.args[0][0].name);
    }
});
