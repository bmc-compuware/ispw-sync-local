import * as core from '@actions/core'
import {execISPWSync, getISPWCLIPath} from './ispw-command-helper'
import {getInputs} from './input-helper'
import {existsSync, readFileSync} from 'fs'
import * as path from 'path'
async function run(): Promise<void> {
  try {
    const curWk = process.env.GITHUB_WORKSPACE

    const parms = getInputs()

    let clipath = ''
    try {
      clipath = await getISPWCLIPath(parms)
    } catch (error) {
      if (error instanceof Error) {
        core.debug(`${error.message}`)
        throw error
      }
    }

    try {
      await execISPWSync(clipath, parms, curWk)
    } catch (error) {
      if (error instanceof Error) {
        core.debug(`${error.message}`)
        throw error
      }
    }

    core.info('Setting up the output values')
    console.log("curWk : " + curWk);
    const workpace: string = curWk ?? ''

    //Execution is completed
    try {
      console.log("workpace : " + workpace);
      const autoBuildParms = path.join(workpace, 'automaticBuildParams.txt')
      if (existsSync(autoBuildParms)) {
        const dataStr = readFileSync(autoBuildParms).toString('utf8')
        core.setOutput('automaticBuildJson', dataStr)
      }
    } catch (error) {
      if (error instanceof Error) {
        core.info(`Fail to read file: automaticBuildParams.txt`)
        core.info(error.message)
      }
    }

    try {
      const changedProgs = path.join(workpace, 'changedPrograms.json')
      if (existsSync(changedProgs)) {
        const dataStr = readFileSync(changedProgs).toString('utf8')
        core.setOutput('changedProgramsJson', dataStr)
      }
    } catch (error) {
      if (error instanceof Error) {
        core.info(`Fail to read file: changedPrograms.json`)
        core.info(error.message)
      }
    }

    core.info('ISPW Sync action is completed')
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run()
