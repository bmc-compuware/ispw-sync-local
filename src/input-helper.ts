import * as core from '@actions/core'
import * as github from '@actions/github'
import * as path from 'path'
import * as fs from 'fs'
import {IISPWSyncParms} from './ispw-sync-parms'

export function getInputs(): IISPWSyncParms {
  const result = ({} as unknown) as IISPWSyncParms

  let githubWorkspacePath = process.env['GITHUB_WORKSPACE']

  if (!githubWorkspacePath) {
    throw new Error('The environment variable GITHUB_WORKSPACE is not defined')
  }

  githubWorkspacePath = path.resolve(githubWorkspacePath)
  core.debug(`GITHUB_WORKSPACE = '${githubWorkspacePath}'`)

  try {
    fs.statSync(githubWorkspacePath)
  } catch (error) {
    // if (error.message === 'ENOENT') {
    //   throw new Error(`Directory '${githubWorkspacePath}' does not exist`)
    // }

    throw new Error(
      `Encountered an error when checking whether path '${githubWorkspacePath}' exists`
    )
  }

  result.workspace = githubWorkspacePath

  result.host = core.getInput('host', {required: true})
  result.port = Number(core.getInput('port', {required: true})).valueOf()
  result.encryptionProtocol = core.getInput('encryptionProtocol')
  result.codePage = core.getInput('codePage')
  result.timeout = Number(core.getInput('timeout')).valueOf()

  result.uid = core.getInput('uid', {required: false})
  result.pass = core.getInput('pass', {required: false})
  result.certificate = core.getInput('certificate', {required: false})
  result.runtimeConfiguration = core.getInput('runtimeConfiguration', {
    required: true
  })
  result.stream = core.getInput('stream', {required: true})
  result.application = core.getInput('application', {required: true})
  result.subAppl = core.getInput('subAppl', {required: false})
  result.checkoutLevel = core.getInput('checkoutLevel', {required: true})

  result.gitUid = core.getInput('gitUid', {required: true})
  result.gitToken = core.getInput('gitToken', {required: true})

  let repoUrl = process.env['GITHUB_REPOSITORY']
  const repoServer = process.env['GITHUB_SERVER_URL']

  if (!repoServer) {
    throw new Error('The environment variable GITHUB_SERVER_URL is not defined')
  }

  if (!repoUrl) {
    throw new Error('The environment variable GITHUB_REPOSITORY is not defined')
  }
  repoUrl = repoServer.concat('/').concat(repoUrl)

  if (repoUrl && !repoUrl.endsWith('.git')) {
    repoUrl = repoUrl.concat('.git')
  }
  result.gitRepoUrl = repoUrl
  core.debug(`GitHub Repo url  = '${result.gitRepoUrl}'`)

  let ref: string = github.context.ref
  core.debug(`github.context.ref  = '${ref}'`)

  if (ref && ref.startsWith('refs/heads/')) {
    ref = ref.substring('refs/heads/'.length)
  }
  result.gitBranch = ref
  result.gitCommit = github.context.sha

  core.debug(`GitHub branch  = '${result.gitBranch}'`)

  let containerCreation = core.getInput('containerCreation')
  if (!containerCreation) {
    containerCreation = 'per-commit'
  }
  result.containerCreation = containerCreation
  result.containerDescription = core.getInput('containerDescription')

  result.winTopazPath = core.getInput('winTopazPath')
  result.unixTopazPath = core.getInput('unixTopazPath')

  // users need make sure Topaz CLI is installed at the same path

  if (process.platform === 'win32') {
    if (!result.winTopazPath) {
      throw new Error('Topaz CLI Path not defined')
    } else {
      validatePath(result.winTopazPath)
    }
  }

  if (process.platform === 'linux' || process.platform === 'sunos') {
    if (!result.unixTopazPath) {
      throw new Error('Topaz CLI Path not defined')
    } else {
      validatePath(result.unixTopazPath)
    }
  }

  result.showEnv =
    (core.getInput('showEnv') || 'false').toUpperCase() === 'TRUE'

  // SHA?
  // if (result.ref.match(/^[0-9a-fA-F]{40}$/)) {
  //  result.commit = result.ref
  //  result.ref = ''
  //}

  let inputargs = ` Parsed the input arguments: 
    application= ${result.application},
    subAppl= ${result.subAppl},
    checkoutLevel= ${result.checkoutLevel},
    codePage= ${result.codePage},
    containerCreation= ${result.containerCreation},
    containerDescription=${result.containerDescription},
    encryptionProtocol=${result.encryptionProtocol},
    gitBranch=${result.gitBranch},
    gitCommit=${result.gitCommit},
    gitToken=${result.gitToken},
    gitRepoUr=${result.gitRepoUrl},
    gitUid=${result.gitUid},
    host=${result.host},
    port=${result.port},
    runtimeConfiguration=${result.runtimeConfiguration},
    showEnv=${result.showEnv},
    stream=${result.stream},
    application=${result.application},
    winTopazPath=${result.winTopazPath},
    workspace=${result.workspace}`

  let logargs = ` Parsed the input arguments: 
  application= ${result.application},
  subAppl= ${result.subAppl},
  checkoutLevel= ${result.checkoutLevel},
  codePage= ${result.codePage},
  containerCreation= ${result.containerCreation},
  containerDescription=${result.containerDescription},
  encryptionProtocol=${result.encryptionProtocol},
  gitBranch=${result.gitBranch},
  gitCommit=${result.gitCommit},
  gitRepoUr=${result.gitRepoUrl},
  gitUid=${result.gitUid},
  host=${result.host},
  port=${result.port},
  runtimeConfiguration=${result.runtimeConfiguration},
  showEnv=${result.showEnv},
  stream=${result.stream},
  application=${result.application},
  winTopazPath=${result.winTopazPath},
  workspace=${result.workspace}`

  if (typeof result.certificate != 'undefined' && result.certificate) {
    inputargs = `${inputargs},
    certificate=${result.certificate}`
    logargs = `${logargs},
    certificate=${result.certificate}`
  } else {
    inputargs = `${inputargs},
    pass=${result.pass}`
    logargs = `${logargs},
    pass=${result.pass}`
  }

  core.debug(`parsed input values: ${inputargs}`)

  if (result.showEnv) {
    core.info(logargs)
  }
  return result
}

export async function validatePath(aPath: string): Promise<void> {
  try {
    fs.statSync(aPath)
  } catch (error) {
    // if (error.code === 'ENOENT') {
    //   throw new Error(`Directory '${aPath}' does not exist`)
    // }
    throw new Error(
      `Encountered an error when checking whether path '${aPath}' exists.`
    )
  }
}
