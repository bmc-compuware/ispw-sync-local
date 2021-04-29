import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as io from '@actions/io'
import * as github from '@actions/github'

async function execGit(
  gitPath: string,
  args: string[],
  allowAllExitCodes = false,
  wkspace: string,
  silent = false
): Promise<GitCommandOutput> {
  const result = new GitCommandOutput()
  const env = {}
  const stdout: string[] = []

  const options = {
    cwd: wkspace,
    env,
    silent,
    ignoreReturnCode: allowAllExitCodes,
    listeners: {
      stdout: (data: Buffer) => {
        let outdata = data.toString()
        stdout.push(outdata)
      }
    }
  }

  core.debug('Execute git ' + gitPath + ' with ' + args + ', ' + options)

  result.exitCode = await exec.exec(gitPath, args, options)
  result.stdout = stdout.join('')
  return result
}

class GitCommandOutput {
  stdout = ''
  exitCode = 0
}

export async function getGitPath(): Promise<string> {
  switch (process.platform) {
    case 'win32': {
      const gitPath: string = await io.which('git.exe', true)
      core.debug(`Git path: ${gitPath}`)
      return gitPath
    }
    case 'linux':
    case 'sunos': {
      const gitPath: string = await io.which('git', true)
      core.debug(`Git Path: ${gitPath}`)
      return gitPath
    }
    default:
      throw new Error(`Unsupported system found.`)
  }
}

export async function calculateDiff(
  gitPath: string,
  commitid: string,
  wkspace: string
): Promise<string> {
  const context = github.context

  if (!context) {
    throw new Error('Fail to retrieve the GitHub context')
  }

  let ref
  ref = context.ref

  let baseref
  let headref
  let args: string[] = []

  if (context && context.eventName === 'pull_request') {
    if (!context.payload.pull_request) {
      throw new Error('Fail to retrieve GitHub pull request')
    }

    baseref = context.payload.pull_request.base.sha
    headref = context.payload.pull_request.head.sha
    let shas = baseref.concat('..').concat(headref)

    if (baseref && headref) {
      core.debug(
        `Received GitHub information for pull request event: baseref= ${baseref}, headref= ${headref}, ref= ${ref} `
      )

      args = ['diff', '--name-only', shas]
    } else if (ref) {
      core.debug(
        `Received GitHub information for pull request event: baseref= ${baseref}, headref= ${headref},  ref= ${ref}`
      )

      args = ['diff-tree', '--no-commit-id', '--name-only', '-r', ref]
    }
  } else if (context && github.context.eventName === 'push') {
    if (!context.payload) {
      throw new Error('Fail to get GitHub push event payload')
    }

    baseref = context.payload.before
    headref = context.payload.after
    if (baseref && headref) {
      core.debug(
        `Received GitHub information for push event: baseref= ${baseref}, headref= ${headref}`
      )

      let shas = baseref.concat('..').concat(headref)

      args = ['diff', '--name-only', shas]
    } else if (ref) {
      core.debug(
        `Received GitHub information: baseref= ${baseref}, headref= ${headref},  ref= ${ref}`
      )

      args = ['diff-tree', '--no-commit-id', '--name-only', '-r', ref]
    }
  } else {
    let commit
    if (!commitid && !ref) {
      throw new Error('Fall to get GitHub branch or tag ref')
    }

    if (ref) {
      commit = ref
    } else {
      commit = commitid
    }
    core.debug(
      `Received GitHub information:  ref= ${ref},  commitid = ${commitid}, Commit = ${commit}`
    )

    args = ['diff-tree', '--no-commit-id', '--name-only', '-r', commit]
  }

  if (args.length === 0) {
    throw new Error('Fail to retrieve the commit informaiton from GitHub')
  } else {
    const output: GitCommandOutput = await execGit(
      gitPath,
      args,
      true,
      wkspace,
      true
    )

    if (output) {
      let dataOutput = ''

      for (const line of output.stdout.trim().split('\n')) {
        dataOutput = dataOutput.concat(line).concat(':')
      }
      if (dataOutput.endsWith(':')) {
        dataOutput = dataOutput.substring(0, dataOutput.length - 1)
      }
      core.debug(`Changed files: ${dataOutput}`)
      return dataOutput
    }
  }

  throw new Error('Unexpected error when calculcating the changed files')
}
