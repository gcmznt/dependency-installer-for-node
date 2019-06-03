const { spawn: spawnProcess } = require('child_process')
const { sync: commandExistsSync } = require('command-exists')
const fs = require('fs')
const inquirer = require('inquirer')
const path = require('path')
const pkgDir = require('pkg-dir')

const cases = {
  NO_LOCK: Symbol('NO_LOCK'),
  RUN: Symbol('RUN'),
  INSTALL_PM: Symbol('INSTALL_PM'),
  MORE_LOCKS: Symbol('MORE_LOCKS')
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

function formatChoices (pms) {
  return pms
    .sort((a, b) => (a.installed === b.installed ? 0 : a.installed ? -1 : 1))
    .map(l => ({
      name: l.name,
      disabled: !l.installed && 'Not available'
    }))
}

async function choosePm (list) {
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
      return cases.NO_LOCK
    case 1:
      return pmsLocked[0].installed ? cases.RUN : cases.INSTALL_PM
    default:
      return cases.MORE_LOCKS
  }
}

function updatePmStatus (pm) {
  return {
    ...pm,
    installed: commandExistsSync(pm.cli),
    lockFileExists: lockFileExists(pm.lockFile)
  }
}

function installer (pmsSupported) {
  const pms = pmsSupported.map(updatePmStatus)
  const pmsLocked = pms.filter(pm => pm.lockFileExists)

  switch (getCase(pmsLocked)) {
    case cases.NO_LOCK:
      choosePm(pms).then(installWith)
      break
    case cases.RUN:
      installWith(...pmsLocked)
      break
    case cases.MORE_LOCKS:
      console.log('🔥  More lock files found')
      choosePm(pmsLocked).then(installWith)
      break
    case cases.INSTALL_PM:
      console.log(`🙏  Please install ${pmsLocked[0].name}:`)
      console.log(pmsLocked[0].installer)
      break
  }
}

module.exports = installer
