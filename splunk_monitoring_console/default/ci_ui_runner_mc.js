//  MC CI UI runner script
//
//  This is called by web/ci_ui_integration.sh - see file for input/environment
//  This is NOT called by web_v2/ci_ui_integration.sh - see file for input/environment

//
//  EDIT WITH CAUTION!
//    This script impacts all of our CI runs. If you break it, expect angry yelling.
//
//  WHAT THIS DOES:
//    Executes multiple parallel Karma runs
//    Runs all the linters
//
//  OUTPUT:
//    If one ore more subtasks fail, the exit code will be > 0.


// Configuration

var karmaRuns = [
    { name: 'splunk_monitoring_console', args: ['--apps', 'splunk_monitoring_console'] }
];

var lintingRuns = [
    { name: 'npmLinters', cmd: 'npm', args: ['run', 'ci:lint'] }
];
// Execution

console.log('Running UI Lint and Unit tests for Monitoring Console\n');

var path = require('path');
const {exec} = require('child_process');

var testDir = __dirname;
var karmaPath = path.join('node_modules', 'karma', 'bin', 'karma');
var karmaBaseArgs = [karmaPath, 'start', 'karma.conf.js', '--single-run', '--browsers', 'PhantomJS',
    '--reporters', 'dots,junit', '--no-colors'];
var xmlOutputDir = 'ci_ui_xml';

console.log("env.FE_COVERAGE", process.env.FE_COVERAGE);
var generateCodeCoverage = process.env.FE_COVERAGE === 'true';

function run_lint_unit_tests() {

    if (generateCodeCoverage) {
        var karmaRunIndex;
        for (karmaRunIndex in karmaRuns) {
            karmaRuns[karmaRunIndex].args.push("--coverage");
        }
        console.log("Enabled coverage", karmaRuns);
    }
    else {
        console.log("Running without coverage", karmaRuns);
    }


    var karmaCmds = karmaRuns.map(function (run) {
        return karmaBaseArgs.concat(
            '--junit-directory', xmlOutputDir,
            '--junit-filename', 'test_' + run.name + '.xml',
            run.args).join(' ');
    }).join('\n');

    var lintingCmds = lintingRuns.map(function (run) {
        return [run.cmd].concat(run.args).join(' ');
    }).join('\n');

    console.log("Running tests from:", testDir);
    console.log("Command for Linting:", lintingCmds);
    console.log("Command for Unit Tests:", karmaCmds);
    console.log("Installing dependencies and running lint and tests");
    exec('npm install' + ' && ' + lintingCmds + ' && ' + karmaCmds,
        {
            cwd: testDir
        }
    );
}

run_lint_unit_tests()

