#!/usr/bin/env node
const pms = require('../lib/package-managers.json')
const installer = require('../lib/installer.js')

installer(pms)
