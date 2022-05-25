import {IISPWSyncParms} from './ispw-sync-parms'
import * as core from '@actions/core'
import * as github from '@actions/github'

export async function calculateChangedFiles(
  parms: IISPWSyncParms
): Promise<string> {
  const gitHubToken = parms.gitToken

  if (!gitHubToken) {
    throw new Error('GitHub Token is required')
  }

  const context = github.context

  if (!context) {
    throw new Error('Fail to retrieve an invalid GitHub context')
  }

  const owner = context.repo.owner
  const repo = context.repo.repo
  const ref = context.ref
  let baseref
  let headref

  const octokit = github.getOctokit(gitHubToken)

  if (context.eventName === 'pull_request') {
    if (!context.payload.pull_request) {
      throw new Error('Fail to retrieve GitHub pull request')
    }

    const pullRequestNumber = context.payload.pull_request.number

    baseref = context.payload.pull_request.base.ref
    headref = context.payload.pull_request.head.ref

    if ((!baseref || !headref) && ref) {
      baseref = `${ref}^`
      headref = ref
    }

    core.debug(
      `Received GitHub information for pull request event: baseref= ${baseref}, headref= ${headref}, pullRequestNumber= ${pullRequestNumber}, ref= ${ref}, owner= ${owner}, repo= ${repo}`
    )
  } else if (github.context.eventName === 'push') {
    if (!context.payload) {
      throw new Error('Fall to get GitHub push event payload')
    }
    baseref = context.payload.before
    headref = context.payload.after
    if ((!baseref || !headref) && ref) {
      baseref = `${ref}^`
      headref = ref
    }

    core.info(
      `Received GitHub information for push event: baseref= ${baseref}, headref= ${headref}, ref= ${ref}, owner= ${owner}, repo= ${repo}`
    )
  } else {
    if (!ref) {
      throw new Error('Fail to retrieve GitHub branch or tag ref')
    }
    baseref = `${ref}^`
    headref = ref
  }

  core.info(
    `Received GitHub information: baseref= ${baseref}, headref= ${headref},  ref= ${ref}`
  )

  if (!owner || !repo || !baseref || !headref) {
    throw new Error(
      'Fail to retrieve GitHub context information to calculate the changed files'
    )
  }

  const options = {
    owner,
    repo,
    base: baseref,
    head: headref
  }

  core.info('Calling GitHub API to calculate changed files')
  const response = await octokit.repos.compareCommits(options)
  core.debug(JSON.stringify(response))

  if (!response || !response.data) {
    throw new Error(
      'Unexpected error when calculcating the changed files with GitHub API'
    )
  }
  const files = response.data.files

  if (files) {
    let fileNameStr = ''
    const fileNames = files.map(f => f.filename.concat(':'))

    if (fileNames) {
      for (const afile of fileNames) {
        fileNameStr = fileNameStr.concat(afile)
      }

      if (fileNameStr.endsWith(':')) {
        fileNameStr = fileNameStr.substring(0, fileNameStr.length - 1)
      }
      core.debug(`Changed files: ${fileNameStr}`)
    }
    return fileNameStr
  }

  throw new Error(
    'Unexpected error when calculcating the changed files with GitHub API'
  )
}
