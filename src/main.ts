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
    const workpace: string = curWk ?? ''
	
	core.info('Old Code Start')
    //Execution is completed
    try {
	  core.info('Workspace:'+workpace)
      const autoBuildParms = path.join(workpace, 'automaticBuildParams.txt')
	  core.info('Autobuildparams:'+autoBuildParms)
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
	core.info('Old Code End')
	
	core.info('New Code Start')
	try {
		// Normalize the workspace path to remove any dangerous characters like "../"
		core.info('Workspace'+Workpace)
		const normalizedWorkpace = path.normalize(workpace);
		core.info('Normalized Workspace'+normalizedWorkpace)

		// Check if the resolved path is absolute. If not, throw an error
		if (!path.isAbsolute(normalizedWorkpace)) {
			throw new Error('Invalid workspace path: Path must be absolute');
		}

		// Ensure that the normalized path doesn't escape to unintended directories (no "../" traversal)
		if (normalizedWorkpace.includes('..')) {
			throw new Error('Potential path traversal detected!');
		}

		//const autoBuildParms = path.join(workpace, 'automaticBuildParams.txt')
		const autoBuildParms = path.join(normalizedWorkpace, 'automaticBuildParams.txt')
		core.info('Auto Build Parms'+autoBuildParms)
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
	core.info('New Code End')

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
