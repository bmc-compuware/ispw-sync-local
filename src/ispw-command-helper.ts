import * as core from '@actions/core'
import {exec} from '@actions/exec'
import * as io from '@actions/io'
import * as path from 'path'
import {existsSync, unlinkSync, createWriteStream} from 'fs'
import {IISPWSyncParms} from './ispw-sync-parms'
import * as gitCommand from './git-command-helper'
import {calculateChangedFiles} from './github-restapi-helper'

export async function getISPWCLIPath(parms: IISPWSyncParms): Promise<string> {
  let topazCLIPath = ''

  switch (process.platform) {
    case 'win32': {
      topazCLIPath = parms.winTopazPath

      topazCLIPath = path.join(topazCLIPath, 'IspwCLI.bat')
      topazCLIPath = path.normalize(topazCLIPath)

      core.debug(`Topaz CLI Path: '${topazCLIPath}'`)

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
      core.debug(`Topaz CLI Path: ${topazCLIPath}`)
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

    const curWorkspace = parms.workspace

    const configPath = path.join(curWorkspace, 'ispwcliwk')
    if (!existsSync(configPath)) {
      await io.mkdirP(configPath)
    }

    core.debug(`Check the path: ${configPath}`)

    const changedPrograms = path.join(curWorkspace, 'changedPrograms.json')
    core.debug(`Check the file: ${changedPrograms}`)

    try {
      if (existsSync(changedPrograms)) {
        try {
          unlinkSync(changedPrograms)
          core.info(`Remove obsolete file: ${changedPrograms}`)
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(`Error: ${error.message}`)
          }
        }
      }
    } catch (error) {
      // do nothing
    }

    const autoBuildParms = path.join(curWorkspace, 'automaticBuildParams.txt')
    core.debug(`Check file: ${autoBuildParms}`)
    try {
      if (existsSync(autoBuildParms)) {
        try {
          unlinkSync(autoBuildParms)
          core.info('Remove obsolete file: ${autoBuildParms}')
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(`Error: ${error.message}`)
          }
        }
      }
    } catch (error) {
      // do nothing
    }
    const tempHash = path.join(curWorkspace, 'toHash.txt')
    core.debug(`Check file: ${tempHash}`)
    try {
      if (existsSync(tempHash)) {
        core.info(' Existing obsolete file: ${tempHash}')
        try {
          unlinkSync(tempHash)
          core.info('Remove obsolete file: ${tempHash}')
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(`Error: ${error?.message}`)
          }
        }
      }
    } catch (error) {
      // do nothing
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
      '-id',
      parms.uid,
      '-pass',
      parms.pass,
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
      '-1',
      '-targetFolder',
      parms.workspace,
      '-ispwContainerCreation',
      parms.containerCreation,
      '-gitLocalPath',
      parms.workspace
    ]

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

    if (changedFileList.length > 2048) {
      args.push('-gitCommitFile')
      args.push(tempHash)
    } else {
      args.push('-gitCommit')
      changedFileList = quoteArg(false, changedFileList)
      args.push(changedFileList)
    }

    cwd = quoteArg(true, cwd)
    cliPath = quoteArg(true, cliPath)
    core.debug(`ISPW CLI parms: ${parms}`)

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
