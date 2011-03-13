if (typeof require != "undefined") {
    var testCase = require("buster-util").testCase;
    var sinon = require("sinon");
    var buster = require("buster-core");

    buster.extend(buster, {
        assert: require("buster-assert"),
        eventEmitter: require("buster-event-emitter"),
        xmlReporter: require("../../../../lib/buster-test/reporters/xml")
    });
}

testCase("XMLReporterTest", sinon.testCase({
    setUp: function () {
        this.io = {
            content: "",
            puts: function (str) { this.print(str + "\n"); },
            print: function (str) { this.content += str; },
            toString: function () { return this.content }
        };

        this.reporter = buster.xmlReporter.create({
            io: this.io
        });

        this.assertIO = function (string) {
            buster.assert.match(this.io.toString(), string);
        };
    },

    "should print xml prolog on suite:start": function () {
        this.reporter.suiteStart();

        buster.assert.equals(this.io.toString(),
                             "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\n");
    },

    "should print testsuite element with stats on context:end": function () {
        this.reporter.contextStart({ name: "Context" });
        this.reporter.contextEnd({ name: "Context" });

        this.assertIO('<testsuite errors="0" tests="0" ' +
                      'time="0" failures="0" name="Context">');
        this.assertIO('</testsuite>');
    },

    "should print total time for test suite": function () {
        this.reporter.contextStart({ name: "Context" });
        this.clock.tick(100);
        this.reporter.contextEnd({ name: "Context" });

        this.assertIO('<testsuite errors="0" tests="0" ' +
                      'time="0.1" failures="0" name="Context">');
    },

    "should print total time for each test suite": function () {
        this.reporter.contextStart({ name: "Context" });
        this.clock.tick(100);
        this.reporter.contextEnd({ name: "Context" });
        this.reporter.contextStart({ name: "Context #2" });
        this.clock.tick(200);
        this.reporter.contextEnd({ name: "Context #2" });

        this.assertIO('<testsuite errors="0" tests="0" ' +
                      'time="0.1" failures="0" name="Context">');
        this.assertIO('<testsuite errors="0" tests="0" ' +
                      'time="0.2" failures="0" name="Context #2">');
    },

    "should print total time for each test case": function () {
        this.reporter.contextStart({ name: "Context" });
        this.clock.tick(100);
        this.reporter.contextStart({ name: "Context #2" });
        this.clock.tick(200);
        this.reporter.contextEnd({ name: "Context #2" });
        this.reporter.contextEnd({ name: "Context" });

        this.assertIO('<testsuite errors="0" tests="0" ' +
                      'time="0.3" failures="0" name="Context">');
        this.assertIO('<testcase time="0.1" name="Context">');
        this.assertIO('<testcase time="0.2" name="Context #2">');
    },

    "should count total successful tests": function () {
        this.reporter.contextStart({ name: "Context" });
        this.reporter.testSuccess({ name: "#1" });
        this.reporter.testSuccess({ name: "#2" });
        this.reporter.contextEnd({ name: "Context" });

        this.assertIO('<testsuite errors="0" tests="2" ' +
                      'time="0" failures="0" name="Context">');
    },

    "should count test errors": function () {
        this.reporter.contextStart({ name: "Context" });
        this.reporter.testSuccess({ name: "#1" });
        this.reporter.testError({ name: "#2", error: {} });
        this.reporter.contextEnd({ name: "Context" });

        this.assertIO('<testsuite errors="1" tests="2" ' +
                      'time="0" failures="0" name="Context">');
    },

    "should count test failures": function () {
        this.reporter.contextStart({ name: "Context" });
        this.reporter.testSuccess({ name: "#1" });
        this.reporter.testFailure({ name: "#2", error: {} });
        this.reporter.contextEnd({ name: "Context" });

        this.assertIO('<testsuite errors="0" tests="2" ' +
                      'time="0" failures="1" name="Context">');
    },

    "should count test timeout as failure": function () {
        this.reporter.contextStart({ name: "Context" });
        this.reporter.testSuccess({ name: "#1" });
        this.reporter.testTimeout({ name: "#2", error: {} });
        this.reporter.contextEnd({ name: "Context" });

        this.assertIO('<testsuite errors="0" tests="2" ' +
                      'time="0" failures="1" name="Context">');
    },

    "should reset test count per context": function () {
        this.reporter.contextStart({ name: "Context" });
        this.reporter.testSuccess({ name: "#1" });
        this.reporter.testSuccess({ name: "#2" });
        this.reporter.contextEnd({ name: "Context" });
        this.reporter.contextStart({ name: "Context #2" });
        this.reporter.testSuccess({ name: "#1" });
        this.reporter.contextEnd({ name: "Context #2" });

        this.assertIO('<testsuite errors="0" tests="2" ' +
                      'time="0" failures="0" name="Context">');
        this.assertIO('<testsuite errors="0" tests="1" ' +
                      'time="0" failures="0" name="Context #2">');
    },

    "should reset errors and failures count per context": function () {
        this.reporter.contextStart({ name: "Context" });
        this.reporter.testError({ name: "#1" });
        this.reporter.testFailure({ name: "#2" });
        this.reporter.contextEnd({ name: "Context" });
        this.reporter.contextStart({ name: "Context #2" });
        this.reporter.testFailure({ name: "#1" });
        this.reporter.testFailure({ name: "#2" });
        this.reporter.testError({ name: "#3" });
        this.reporter.testError({ name: "#4" });
        this.reporter.contextEnd({ name: "Context #2" });

        this.assertIO('<testsuite errors="1" tests="2" ' +
                      'time="0" failures="1" name="Context">');
        this.assertIO('<testsuite errors="2" tests="4" ' +
                      'time="0" failures="2" name="Context #2">');
    },

    "should not reset test count for nested context": function () {
        this.reporter.contextStart({ name: "Context" });
        this.reporter.testSuccess({ name: "#1" });
        this.reporter.testSuccess({ name: "#2" });
        this.reporter.contextStart({ name: "Context #2" });
        this.reporter.testSuccess({ name: "#1" });
        this.reporter.contextEnd({ name: "Context #2" });
        this.reporter.contextEnd({ name: "Context" });

        this.assertIO('<testsuite errors="0" tests="3" ' +
                      'time="0" failures="0" name="Context">');
        buster.assert.noMatch(this.io.toString(), /<testsuite[^>]+name="Context #2">/);
    },

    "should not reset error and failures count for nested context": function () {
        this.reporter.contextStart({ name: "Context" });
        this.reporter.testFailure({ name: "#1" });
        this.reporter.testError({ name: "#2" });
        this.reporter.contextStart({ name: "Context #2" });
        this.reporter.testError({ name: "#1" });
        this.reporter.testFailure({ name: "#1" });
        this.reporter.contextEnd({ name: "Context #2" });
        this.reporter.contextEnd({ name: "Context" });

        this.assertIO('<testsuite errors="2" tests="4" ' +
                      'time="0" failures="2" name="Context">');
        buster.assert.noMatch(this.io.toString(), /<testsuite[^>]+name="Context #2">/);
    },

    "should include failure element for failed test": function () {
        this.reporter.contextStart({ name: "Context" });
        this.reporter.testFailure({ name: "#1", error: {
            name: "AssertionError", message: "Expected no failure",
            stack: "STACK\nSTACK"
        } });
        this.reporter.contextEnd({ name: "Context" });

        this.assertIO('        <failure type="AssertionError" ' +
                      'message="Expected no failure">' +
                      "\n            STACK\n            STACK\n        </failure>");
    },

    "should include failure element for all failed tests": function () {
        this.reporter.contextStart({ name: "Context" });
        this.reporter.testFailure({ name: "#1", error: {
            name: "AssertionError", message: "Expected no failure",
            stack: "STACK\nSTACK"
        } });
        this.reporter.testFailure({ name: "#1", error: {
            name: "AssertionError", message: "#2",
            stack: "stack"
        } });
        this.reporter.contextEnd({ name: "Context" });

        this.assertIO('        <failure type="AssertionError" ' +
                      'message="Expected no failure">' +
                      "\n            STACK\n            STACK\n        </failure>");
        this.assertIO('    <failure type="AssertionError" ' +
                      'message="#2">' + "\n            stack\n        </failure>");
    },

    "should include failure element for all errored tests": function () {
        this.reporter.contextStart({ name: "Context" });
        this.reporter.testError({ name: "#1", error: {
            name: "TypeError", message: "Expected no failure",
            stack: "STACK\nSTACK"
        } });
        this.reporter.testError({ name: "#1", error: {
            name: "TypeError", message: "#2",
            stack: "stack"
        } });
        this.reporter.contextEnd({ name: "Context" });

        this.assertIO('        <failure type="TypeError" ' +
                      'message="Expected no failure">' +
                      "\n            STACK\n            STACK\n        </failure>");
        this.assertIO('        <failure type="TypeError" ' +
                      'message="#2">' + "\n            stack\n        </failure>");
    },

    "should add test case element for outer context": function () {
        this.reporter.contextStart({ name: "Context" });
        this.reporter.contextEnd({ name: "Context" });

        this.assertIO('<testcase time="0" name="Context">');
    }
}, "should"));

testCase("XMLReporterEventMappingTest", sinon.testCase({
    setUp: function () {
        this.stub(buster.xmlReporter, "suiteStart");
        this.stub(buster.xmlReporter, "contextStart");
        this.stub(buster.xmlReporter, "contextEnd");
        this.stub(buster.xmlReporter, "testSuccess");
        this.stub(buster.xmlReporter, "testError");
        this.stub(buster.xmlReporter, "testFailure");
        this.stub(buster.xmlReporter, "testTimeout");

        this.runner = buster.create(buster.eventEmitter);
        this.runner.console = buster.create(buster.eventEmitter);
        this.reporter = buster.xmlReporter.create().listen(this.runner);
    },

    "should map suite:start to suiteStart": function () {
        this.runner.emit("suite:start");

        buster.assert(this.reporter.suiteStart);
    },

    "should map context:start to contextStart": function () {
        this.runner.emit("context:start");

        buster.assert(this.reporter.contextStart.calledOnce);
    },

    "should map context:end to contextEnd": function () {
        this.runner.emit("context:end");

        buster.assert(this.reporter.contextEnd.calledOnce);
    },

    "should map test:success to testSuccess": function () {
        this.runner.emit("test:success");

        buster.assert(this.reporter.testSuccess.calledOnce);
    },

    "should map test:error to testError": function () {
        this.runner.emit("test:error");

        buster.assert(this.reporter.testError.calledOnce);
    },

    "should map test:fail to testFailure": function () {
        this.runner.emit("test:failure");

        buster.assert(this.reporter.testFailure.calledOnce);
    },

    "should map test:timeout to testTimeout": function () {
        this.runner.emit("test:timeout");

        buster.assert(this.reporter.testTimeout.calledOnce);
    }
}, "should"));