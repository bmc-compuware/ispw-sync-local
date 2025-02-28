import * as core from '@actions/core'
import {execISPWSync, getISPWCLIPath} from './ispw-command-helper'
import {
  getInputs,
  checkForHarmfulCharAndWords,
  validateInputs
} from './input-helper'
import {existsSync, readFileSync} from 'fs'
import * as path from 'path'
import * as fs from 'fs'
//  @typescript-eslint/no-unused-vars
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {error} from 'console'

async function run(): Promise<void> {
  try {
    const curWk = process.env.GITHUB_WORKSPACE

    const parms = getInputs()

    try {
      validateInputs(parms)
      // eslint-disable-next-line no-shadow
    } catch (error) {
      if (error instanceof Error) {
        core.debug(`${error.message}`)
        throw error
      }
    }

    let clipath = ''
    try {
      clipath = await getISPWCLIPath(parms)
      // eslint-disable-next-line no-shadow
    } catch (error) {
      if (error instanceof Error) {
        core.debug(`${error.message}`)
        throw error
      }
    }

    try {
      await execISPWSync(clipath, parms, curWk)
      // eslint-disable-next-line no-shadow
    } catch (error) {
      if (error instanceof Error) {
        core.debug(`${error.message}`)
        throw error
      }
    }

    core.info('Setting up the output values')
    const workpace: string = curWk ?? ''

    //Execution is completed
    try {
      //if (allowedCharsRegex.test(workpace)) {
      if (checkForHarmfulCharAndWords(workpace)) {
        // Normalize and resolve the workspace path to ensure it's absolute and sanitized
        const resolvedWorkspace = path.resolve(path.normalize(workpace))

        // Ensure the resolvedWorkspace is within the allowed base directory (GITHUB_WORKSPACE)
        const baseWorkspace = path.resolve(
          path.normalize(process.env.GITHUB_WORKSPACE || '')
        )
        const relativePath = path.relative(baseWorkspace, resolvedWorkspace)

        // If relativePath starts with '..', it means resolvedWorkspace is outside the base directory
        if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
          throw new Error('Potential path traversal detected!')
        }

        const autoBuildParms = path.join(
          resolvedWorkspace,
          'automaticBuildParams.txt'
        )
        const realAutoBuildParms = fs.realpathSync(autoBuildParms)

        // Ensure that autoBuildParms is within the resolvedWorkspace
        const relativeAutoBuild = path.relative(
          resolvedWorkspace,
          realAutoBuildParms
        )
        if (
          !relativeAutoBuild.startsWith('..') &&
          !path.isAbsolute(relativeAutoBuild) &&
          existsSync(realAutoBuildParms)
        ) {
          const dataStr = readFileSync(realAutoBuildParms, 'utf8')
          core.setOutput('automaticBuildJson', dataStr)
        } else {
          core.warning(
            `Path for autoBuildParms is not valid or does not exist: ${autoBuildParms}`
          )
        }
      } else {
        throw new Error(
          `Invalid path: The path contains disallowed characters or Harmful words. Please check workspace directory path`
        )
      }
      // eslint-disable-next-line no-shadow
    } catch (error) {
      if (error instanceof Error) {
        core.info(`Failed to read file: automaticBuildParams.txt`)
        core.info(error.message)
      }
    }

    try {
      const changedProgs = path.join(workpace, 'changedPrograms.json')
      if (existsSync(changedProgs)) {
        const dataStr = readFileSync(changedProgs).toString('utf8')
        core.setOutput('changedProgramsJson', dataStr)
      }
      // eslint-disable-next-line no-shadow
    } catch (error) {
      if (error instanceof Error) {
        core.info(`Fail to read file: changedPrograms.json`)
        core.info(error.message)
      }
    }

    core.info('ISPW Sync action is completed')
    // eslint-disable-next-line no-shadow
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run()
