/*
 * How to use this script ?
 * node set-config-file.js --env=<env> --oktaUsername=<username> --oktaPassword=<password> --tokenSecret=<tokenSecret>
 */

const editJsonFile = require("edit-json-file");
const args = require("minimist")(process.argv.slice(2));
const envName = args["env"] || "dev";
const oktaUsername = args["oktaUsername"] || '';
const oktaPassword = args["oktaPassword"] || '';
const tokenSecret = args["tokenSecret"] || '';


let configFile = editJsonFile(`./cypress/config/${envName}.json`);
configFile.set("env.username", oktaUsername);
configFile.set("env.password", oktaPassword);
configFile.set("env.token_secret", tokenSecret);
configFile.save();
