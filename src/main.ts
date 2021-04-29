import * as core from '@actions/core'
import {execISPWSync, getISPWCLIPath} from './ispw-command-helper'
import {getInputs, validatePath} from './input-helper'
import {existsSync, readFileSync} from 'fs'
import * as path from 'path'
async function run(): Promise<void> {
  try {
    const curWk = process.env.GITHUB_WORKSPACE

    let parms = getInputs()

    let clipath = ''
    try {
      clipath = await getISPWCLIPath(parms)
    } catch (error) {
      core.debug(`${error.message}`)
      throw error
    }

    try {
      await execISPWSync(clipath, parms, curWk)
    } catch (err) {
      core.debug(`${err.message}`)
      throw err
    }

    core.info('Setting up the output values')
    let workpace: string = curWk ?? ''

    //Execution is completed
    try {
      const autoBuildParms = path.join(workpace, 'automaticBuildParams.txt')
      if (existsSync(autoBuildParms)) {
        const dataStr = readFileSync(autoBuildParms).toString('utf8')
        core.setOutput('automaticBuildJson', dataStr)
      }
    } catch (err) {
      core.info(`Fail to read file: automaticBuildParams.txt`)
      core.info(err.message)
    }

    try {
      const changedProgs = path.join(workpace, 'changedPrograms.json')
      if (existsSync(changedProgs)) {
        const dataStr = readFileSync(changedProgs).toString('utf8')
        core.setOutput('changedProgramsJson', dataStr)
      }
    } catch (err) {
      core.info(`Fail to read file: changedPrograms.json`)
      core.info(err.message)
    }

    core.info('ISPW Sync action is completed')
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
