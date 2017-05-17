var exec = require('child_process').exec;

/**
 * Basically executes the typescript compiler, ignoring any type issues with the `node_modules` directory, because
 * has a malformed type definition.
 */
exec('tsc', function (err, stdout, stderr) {
    if (err) {
        var hasErrors = false;
        stdout.split("\n").forEach(function (n) {
            if (n.match(/\w/g) && n.indexOf("node_modules") < 0) {
                console.log(n);
                hasErrors = true;
            }
        });

        if (hasErrors) {
            process.exit(err.code);
        }
    }
});
