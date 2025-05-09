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
  result.ispwConfigPath = core.getInput('ispwConfigPath', {required: false})
  result.checkoutLevel = core.getInput('checkoutLevel', {required: true})
  result.assignmentPrefix = core.getInput('assignmentPrefix', {required: false})
  result.gitCommitFile = core.getInput('gitCommitFile', {required: false})

  let gitFromHash = core.getInput('gitFromHash')
  let gitCommit = core.getInput('gitCommit')

  if ((gitFromHash && !gitCommit) || (!gitFromHash && gitCommit)) {
    throw new Error(
      'gitCommit and gitFromHash variables need to be defined together'
    )
  }

  if (!gitFromHash) {
    gitFromHash = '-1'
  }
  result.gitFromHash = gitFromHash

  if (!gitCommit) {
    gitCommit = github.context.sha
  }
  result.gitCommit = gitCommit

  let gitLocalPath = core.getInput('gitLocalPath')
  if (!gitLocalPath) {
    gitLocalPath = githubWorkspacePath
  }
  result.gitLocalPath = gitLocalPath

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
  let gitRepoUrl = core.getInput('gitRepoUrl')
  if (!gitRepoUrl) {
    gitRepoUrl = repoUrl
  }
  result.gitRepoUrl = gitRepoUrl
  core.debug(`GitHub Repo url  = '${result.gitRepoUrl}'`)

  let ref: string = github.context.ref
  core.debug(`github.context.ref  = '${ref}'`)

  if (ref && ref.startsWith('refs/heads/')) {
    ref = ref.substring('refs/heads/'.length)
  }

  let gitBranch = core.getInput('gitBranch')
  if (!gitBranch) {
    gitBranch = ref
  }
  result.gitBranch = gitBranch
  core.debug(`GitHub branch  = '${result.gitBranch}'`)

  let containerCreation = core.getInput('containerCreation')
  if (!containerCreation) {
    containerCreation = 'per-commit'
  }
  result.containerCreation = containerCreation
  result.containerDescription = core.getInput('containerDescription')

  result.winTopazPath = core.getInput('winTopazPath')
  result.unixTopazPath = core.getInput('unixTopazPath')

  // users need make sure Workbench CLI is installed at the same path

  if (process.platform === 'win32') {
    if (!result.winTopazPath) {
      throw new Error('Workbench CLI Path not defined')
    } else {
      validatePath(result.winTopazPath)
    }
  }

  if (process.platform === 'linux' || process.platform === 'sunos') {
    if (!result.unixTopazPath) {
      throw new Error('Workbench CLI Path not defined')
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
    workspace=${result.workspace},
    ispwConfigPath= ${result.ispwConfigPath},
    assignmentPrefix = ${result.assignmentPrefix},
    gitCommit = ${result.gitCommit},
    gitFromHash = ${result.gitFromHash},
    gitCommitFile = ${result.gitCommitFile},
    gitLocalPath = ${result.gitLocalPath}
    `

  let logargs = ` Parsed the input arguments: 
  application= ${result.application},
  subAppl= ${result.subAppl},
  checkoutLevel= ${result.checkoutLevel},
  codePage= ${result.codePage},
  containerCreation= ${result.containerCreation},
  containerDescription=${result.containerDescription},
  encryptionProtocol=${result.encryptionProtocol},
  gitBranch=${result.gitBranch},
  gitRepoUr=${result.gitRepoUrl},
  gitUid=${result.gitUid},
  host=${result.host},
  port=${result.port},
  runtimeConfiguration=${result.runtimeConfiguration},
  showEnv=${result.showEnv},
  stream=${result.stream},
  application=${result.application},
  winTopazPath=${result.winTopazPath},
  workspace=${result.workspace},
  ispwConfigPath= ${result.ispwConfigPath},
  assignmentPrefix = ${result.assignmentPrefix},
  gitCommit = ${result.gitCommit},
  gitFromHash = ${result.gitFromHash},
  gitCommitFile = ${result.gitCommitFile},
  gitLocalPath = ${result.gitLocalPath}`

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

/**
 * Function that checks if the input string contains the word 'safe'.
 * @param input The string to check
 * @returns { boolean } Returns true if 'safe' is found in the input string, otherwise false.
 */
export function checkForHarmfulCharAndWords(input: string): boolean {
  // eslint-disable-next-line no-useless-escape
  const harmfulCharsRegex = /^[a-zA-Z0-9_\-\.\/\\]+$/g

  const harmfulWords = [
    'config',
    'bin',
    'secret',
    'password',
    'admin',
    'backup',
    'restricted',
    'bin'
  ]

  // Check for harmful characters using the regex
  if (harmfulCharsRegex.test(input)) {
    return false // Harmful character found
  }

  // Check for harmful words in the input string
  const inputLowerCase = input.toLowerCase() // Convert the input to lowercase for case-insensitive comparison
  for (const word of harmfulWords) {
    if (inputLowerCase.includes(word.toLowerCase())) {
      return false // Harmful word found
    }
  }

  return true // No harmful characters or words found
}

export function validateInputs(input: IISPWSyncParms): boolean {
  // Validate all string parameters (path safety)
  const stringParams = [
    input.host,
    input.encryptionProtocol,
    input.codePage,
    input.runtimeConfiguration,
    input.stream,
    input.application,
    input.subAppl,
    input.checkoutLevel,
    input.gitRepoUrl,
    input.containerCreation,
    input.containerDescription,
    input.gitBranch,
    input.gitCommit,
    input.ispwConfigPath,
    input.assignmentPrefix,
    input.gitFromHash,
    input.gitCommitFile,
    input.gitLocalPath
  ]

  for (const param of stringParams) {
    if (typeof param !== 'string') return false

    if(!isSafeCommandInput(param)) return false

  }

  // Validate all numeric parameters
  const numberParams = [input.port, input.timeout]

  for (const param of numberParams) {
    if (typeof param !== 'number' || isNaN(param) || param < 0) {
      // eslint-disable-next-line no-console
      console.error(`Invalid number detected: ${param}`)
      return false
    }

    if(!isSafeNumberInput(param)) return false
  }

  if (typeof input.showEnv != 'boolean') {
    return false
  }

  return true

}

function isSafeCommandInput(input: string): boolean {
  //Allow only alphanumerics, space, underscore, dash
  const safePattern = /^[a-zA-Z0-9 _-]+$/;

  //Blacklist characters often used in injections
  const dangerousPattern = /[;&|$`<>\\!()\[\]{}'"*?]/;

  //Return true only if input matches safe pattern
  return safePattern.test(input) && !dangerousPattern.test(input);
}

function isSafeNumberInput(input: any): boolean {
  //Check that the input is either a number or a numeric string
  const isNumeric = typeof input === 'number' || /^[0-9]+$/.test(input);

  //Prevent things like "123; rm -rf /"
  const hasOnlyDigits = String(input).match(/^[0-9]+$/);

  return isNumeric && !!hasOnlyDigits;
}
