import * as core from '@actions/core'
import {execISPWSync, getISPWCLIPath} from './ispw-command-helper'
import {getInputs} from './input-helper'
import {existsSync, readFileSync} from 'fs'
import * as path from 'path'
import * as fs from 'fs';

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

    //Execution is completed
    try {
      // Normalize and resolve the workspace path to ensure it's absolute and sanitized
      const resolvedWorkspace = path.resolve(path.normalize(workpace));
    
      // Ensure the resolvedWorkspace is within the allowed base directory (GITHUB_WORKSPACE)
      const baseWorkspace = path.resolve(path.normalize(process.env.GITHUB_WORKSPACE || ''));
      const relativePath = path.relative(baseWorkspace, resolvedWorkspace);
    
      // If relativePath starts with '..', it means resolvedWorkspace is outside the base directory
      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        throw new Error('Potential path traversal detected!');
      }
    
      const autoBuildParms = path.join(resolvedWorkspace, 'automaticBuildParams.txt');
      const realAutoBuildParms = fs.realpathSync(autoBuildParms);
    
      // Ensure that autoBuildParms is within the resolvedWorkspace
      const relativeAutoBuild = path.relative(resolvedWorkspace, realAutoBuildParms);
      if (!relativeAutoBuild.startsWith('..') && !path.isAbsolute(relativeAutoBuild) && existsSync(realAutoBuildParms)) {
        const dataStr = readFileSync(realAutoBuildParms, 'utf8');
        core.setOutput('automaticBuildJson', dataStr);
      } else {
        core.warning(`Path for autoBuildParms is not valid or does not exist: ${autoBuildParms}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        core.info(`Failed to read file: automaticBuildParams.txt`);
        core.info(error.message);
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
