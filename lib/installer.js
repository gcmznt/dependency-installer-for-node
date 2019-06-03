const { spawn: spawnProcess } = require('child_process')
const { sync: commandExistsSync } = require('command-exists')
const fs = require('fs')
const inquirer = require('inquirer')
const path = require('path')
const pkgDir = require('pkg-dir')

const cases = {
  FRESH: Symbol('FRESH'),
  RUN: Symbol('RUN'),
  INSTALL: Symbol('INSTALL'),
  MORE: Symbol('MORE')
}

function lockFileExists (lockFile) {
  try {
    fs.accessSync(path.join(pkgDir.sync(), lockFile))
    return true
  } catch (err) {
    return false
  }
}

function installWith (pm) {
  return spawnProcess(pm.cli, pm.args, { stdio: 'inherit' })
}

function install (pms) {
  if (pms.length > 1) {
    choose(pms).then(installWith)
  } else {
    installWith(...pms)
  }
}

function formatChoices (pms) {
  return pms
    .sort((a, b) => (a.installed === b.installed ? 0 : a.installed ? -1 : 1))
    .map(l => ({
      name: l.name,
      disabled: !l.installed && 'Not available'
    }))
}

async function choose (list) {
  return inquirer
    .prompt([
      {
        type: 'list',
        name: 'tech',
        message: 'What package manager do you want to use?',
        choices: formatChoices(list)
      }
    ])
    .then(answers => list.find(p => p.name === answers.tech))
}

function getCase (pmsLocked) {
  switch (pmsLocked.length) {
    case 0:
      return cases.FRESH
    case 1:
      return pmsLocked.find(pm => pm.installed) ? cases.RUN : cases.INSTALL
    default:
      return cases.MORE
  }
}

function checkPm (pm) {
  return {
    ...pm,
    installed: commandExistsSync(pm.cli),
    lockFileExists: lockFileExists(pm.lockFile)
  }
}

function installer (pmSupported) {
  const pms = pmSupported.map(checkPm)
  const pmsLocked = pms.filter(pm => pm.lockFileExists)

  switch (getCase(pmsLocked)) {
    case cases.FRESH:
      install(pms)
      break
    case cases.RUN:
      install(pmsLocked)
      break
    case cases.MORE:
      console.log('🔥  More lock files found')
      install(pmsLocked)
      break
    case cases.INSTALL:
      console.log(`🙏  Please install ${pmsLocked[0].name}:`)
      console.log(pmsLocked[0].installer)
      break
  }
}

module.exports = installer
