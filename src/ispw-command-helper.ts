import * as core from '@actions/core'
import {exec} from '@actions/exec'
import * as io from '@actions/io'
import * as path from 'path'
import {existsSync, unlinkSync, createWriteStream} from 'fs'
import {IISPWSyncParms} from './ispw-sync-parms'
import * as gitCommand from './git-command-helper'
import {calculateChangedFiles} from './github-restapi-helper'
import * as fs from 'fs';

export async function getISPWCLIPath(parms: IISPWSyncParms): Promise<string> {
  let topazCLIPath = ''

  switch (process.platform) {
    case 'win32': {
      topazCLIPath = parms.winTopazPath

      topazCLIPath = path.join(topazCLIPath, 'IspwCLI.bat')
      topazCLIPath = path.normalize(topazCLIPath)

      core.debug(`Workbench CLI Path: '${topazCLIPath}'`)

      if (existsSync(topazCLIPath)) {
        return topazCLIPath
      } else {
        throw new Error(
          `Unable to locate IspwCLI.bat. Please verify the file path '${topazCLIPath}' exists`
        )
      }
    }
    case 'linux':
    case 'sunos': {
      topazCLIPath = parms.unixTopazPath
      topazCLIPath = path.join(topazCLIPath, 'IspwCLI.sh')
      topazCLIPath = path.normalize(topazCLIPath)
      core.debug(`Workbench CLI Path: ${topazCLIPath}`)
      if (existsSync(topazCLIPath)) {
        return topazCLIPath
      } else {
        throw new Error(
          `Unable to locate IspwCLI.sh. Please verify the file path '${topazCLIPath}' exists`
        )
      }
    }
    default:
      throw new Error(`Unsupported system found.`)
  }
}

export async function execISPWSync(
  cliPath: string,
  parms: IISPWSyncParms,
  cwd?: string
): Promise<void> {
  try {
    core.info('Start ISPW Sync action')

    if (!parms || !cwd) {
      core.debug('Fail to get input values or environment settings')
      throw new Error(`Fail to get input values or environment settings`)
    }

    // Resolve the workspace to an absolute and canonical path to prevent directory traversal
    const curWorkspace = fs.realpathSync(path.resolve(parms.workspace));

    const configPath = path.join(curWorkspace, 'ispwcliwk');
    // Prevent path traversal using path.relative() after resolving the real path
    const relativeConfigPath = path.relative(curWorkspace, fs.realpathSync(configPath));

    if (!relativeConfigPath.startsWith('..') && !path.isAbsolute(relativeConfigPath)) {
      if (!existsSync(configPath)) {
        await io.mkdirP(configPath);
      }
    } else {
      core.error("Potential path manipulation detected in configPath");
      throw new Error("Invalid configPath");
    }

    core.debug(`Check the path: ${configPath}`);

    const changedPrograms = path.join(curWorkspace, 'changedPrograms.json');
    const relativeChangedPrograms = path.relative(curWorkspace, fs.realpathSync(changedPrograms));

    if (!relativeChangedPrograms.startsWith('..') && !path.isAbsolute(relativeChangedPrograms)) {
      core.debug(`Check the file: ${changedPrograms}`);

      try {
        if (existsSync(changedPrograms)) {
          try {
            unlinkSync(changedPrograms);
            core.info(`Remove obsolete file: ${changedPrograms}`);
          } catch (error) {
            if (error instanceof Error) {
              throw new Error(`Error: ${error.message}`);
            }
          }
        }
      } catch (error) {
        core.warning("Error during file removal");
      }
    } else {
      core.error("Potential path manipulation detected in changedPrograms");
      throw new Error("Invalid changedPrograms path");
    }

    const autoBuildParms = path.join(curWorkspace, 'automaticBuildParams.txt');
    const relativeAutoBuildParms = path.relative(curWorkspace, fs.realpathSync(autoBuildParms));

    if (!relativeAutoBuildParms.startsWith('..') && !path.isAbsolute(relativeAutoBuildParms)) {
      core.debug(`Check file: ${autoBuildParms}`);
      try {
        if (existsSync(autoBuildParms)) {
          try {
            unlinkSync(autoBuildParms);
            core.info('Remove obsolete file: ${autoBuildParms}');
          } catch (error) {
            if (error instanceof Error) {
              throw new Error(`Error: ${error.message}`);
            }
          }
        }
      } catch (error) {
        core.warning("Error during file removal");
      }
    } else {
      core.error("Potential path manipulation detected in autoBuildParms");
      throw new Error("Invalid autoBuildParms path");
    }

    const tempHash = path.join(curWorkspace, 'toHash.txt');
    const relativeTempHash = path.relative(curWorkspace, fs.realpathSync(tempHash));

    if (!relativeTempHash.startsWith('..') && !path.isAbsolute(relativeTempHash)) {
      core.debug(`Check file: ${tempHash}`);
      try {
        if (existsSync(tempHash)) {
          core.info(`Existing obsolete file: ${tempHash}`);
          try {
            unlinkSync(tempHash);
            core.info('Remove obsolete file: ${tempHash}');
          } catch (error) {
            if (error instanceof Error) {
              throw new Error(`Error: ${error?.message}`);
            }
          }
        }
      } catch (error) {
        core.warning("Error during file removal");
      }
    } else {
      core.error("Potential path manipulation detected in tempHash");
      throw new Error("Invalid tempHash path");
    }

    let gitPath
    try {
      gitPath = await gitCommand.getGitPath()
    } catch (error) {
      // do nothing
    }

    let changedFileList = undefined

    if (gitPath) {
      gitPath = path.resolve(gitPath)
      changedFileList = await gitCommand.calculateDiff(
        'git',
        parms.gitCommit,
        curWorkspace
      )
    } else {
      changedFileList = await calculateChangedFiles(parms)
    }

    if (!changedFileList || changedFileList.length <= 1) {
      core.info('There is no changed files found.')
      return
    } else {
      if (changedFileList.length > 2048) {
        const writeStream = createWriteStream(tempHash)
        writeStream.write(changedFileList)
        writeStream.end()
      }
    }

    //-gitCommitFile

    const args = [
      '-data',
      configPath,
      '-host',
      parms.host,
      '-port',
      parms.port.toString(),
      '-operation',
      'syncGitToIspw',
      '-ispwServerConfig',
      parms.runtimeConfiguration,
      '-ispwServerStream',
      parms.stream,
      '-ispwServerApp',
      parms.application,
      '-ispwCheckoutLevel',
      parms.checkoutLevel,
      '-gitRepoUrl',
      parms.gitRepoUrl,
      '-gitUsername',
      parms.gitUid,
      '-gitPassword',
      parms.gitToken,
      '-gitBranch',
      parms.gitBranch,
      '-gitFromHash',
      parms.gitFromHash,
      '-targetFolder',
      parms.workspace,
      '-ispwContainerCreation',
      parms.containerCreation,
      '-gitLocalPath',
      parms.gitLocalPath
    ]

    if (parms.subAppl) {
      args.push('-ispwServerSubAppl')
      args.push(parms.subAppl)
    }

    if (parms.assignmentPrefix) {
      args.push('-assignmentPrefix')
      args.push(parms.assignmentPrefix)
    }
    if (parms.ispwConfigPath) {
      args.push('-ispwConfigPath')
      args.push(parms.ispwConfigPath)
    }

    if (typeof parms.certificate != 'undefined' && parms.certificate) {
      args.push('-certificate')
      args.push(parms.certificate)
    } else {
      args.push('-id')
      args.push(parms.uid)
      args.push('-pass')
      args.push(parms.pass)
    }

    if (parms.timeout) {
      args.push('-timeout')
      args.push(parms.timeout.toString())
    }

    if (parms.codePage) {
      args.push('-code')
      args.push(parms.codePage)
    }

    if (parms.encryptionProtocol) {
      args.push('-protocol')
      args.push(parms.encryptionProtocol)
    }

    if (parms.containerDescription) {
      args.push('-ispwContainerDescription')
      args.push(parms.containerDescription)
    }
	  const gitCommit = core.getInput('gitCommit');
    if (changedFileList.length > 2048) {
      args.push('-gitCommitFile')
      args.push(tempHash)
    } 
    else if (gitCommit) {
      args.push('-gitCommit')
      args.push(parms.gitCommit)
    }else {
      args.push('-gitCommit')
      changedFileList = quoteArg(false, changedFileList)
      args.push(changedFileList)
    }

    if (parms.gitCommitFile) {
      args.push('-gitCommitFile')
      args.push(parms.gitCommitFile)
    }

    cwd = quoteArg(true, cwd)
    cliPath = quoteArg(true, cliPath)
    core.debug(`Code Pipeline CLI parms: ${parms}`)

    await exec(cliPath, args, {cwd})
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error: ${error.message}`)
    }
  }
}

export function quoteArg(escape: boolean, arg?: string): string {
  if (!arg) {
    return ''
  }

  if (process.platform === 'linux' || process.platform === 'sunos' || escape) {
    const cmdSpecialChars = [' ', '\t', '"', "'"]
    let needsQuotes = false
    for (const char of arg) {
      if (cmdSpecialChars.some(x => x === char)) {
        needsQuotes = true
        break
      }
    }
    if (needsQuotes) {
      arg = `"${arg}"`
      core.debug(`Quote the value '${arg}' `)
    }
  }

  return arg
}
