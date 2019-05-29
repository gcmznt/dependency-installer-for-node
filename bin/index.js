#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const pkgDir = require("pkg-dir");
const { spawn } = require("child_process");
var inquirer = require("inquirer");

const installers = {
  npm: () => {
    spawn("npm", ["install"], { stdio: "inherit" });
  },
  yarn: () => {
    spawn("yarn", [], { stdio: "inherit" });
  }
};

function choose(list) {
  return inquirer
    .prompt([
      {
        type: "list",
        name: "tech",
        message: "What package manager do you want to use?",
        choices: list
      }
    ])
    .then(answers => {
      installers[answers.tech]();
    });
}

const rootDir = pkgDir.sync();
let installer = [];

try {
  fs.accessSync(path.join(rootDir, "package-lock.json"));
  installer.push("npm");
} catch (err) {
  // console.error("no access!");
}

try {
  fs.accessSync(path.join(rootDir, "yarn.lock"));
  installer.push("yarn");
} catch (err) {
  // console.error("no access!");
}

if (installer.length === 0) {
  console.log("😢 No lock file found");
  choose(["npm", "yarn"]);
} else if (installer.length === 1) {
  installers[installer]();
} else {
  console.log("🔥 More lock files found");
  choose(installer);
}
