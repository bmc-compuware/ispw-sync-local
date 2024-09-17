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

    core.info('Setting up the output values');
    const workspace: string = curWk ?? '';
    
    try {
      // Normalize and resolve the workspace path to ensure it's absolute and sanitized
      const resolvedWorkspace = path.resolve(path.normalize(workspace));
    
      // Use path.normalize and validate against the GITHUB_WORKSPACE
      const normalizedWorkspace = path.normalize(process.env.GITHUB_WORKSPACE || '');
    
      // Use path.relative() to check if resolvedWorkspace is within the GITHUB_WORKSPACE
      const relativePath = path.relative(normalizedWorkspace, resolvedWorkspace);
    
      // If relativePath starts with '..', it means resolvedWorkspace is outside the base directory
      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        throw new Error('Potential path traversal detected!');
      }
    
      const autoBuildParms = path.join(resolvedWorkspace, 'automaticBuildParams.txt');
      const normalizedAutoBuild = path.normalize(autoBuildParms);
    
      // Validate that autoBuildParms is within resolvedWorkspace by comparing normalized paths
      const relativeAutoBuild = path.relative(resolvedWorkspace, normalizedAutoBuild);
      if (!relativeAutoBuild.startsWith('..') && existsSync(normalizedAutoBuild)) {
        const dataStr = readFileSync(normalizedAutoBuild).toString('utf8');
        core.setOutput('automaticBuildJson', dataStr);
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