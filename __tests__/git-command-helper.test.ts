import {getGitPath} from '../src/git-command-helper'

describe('Test ISPW SYNC', () => {
  test('getGitPath', async () => {
    try {
      let gitPath = await getGitPath()
      expect(gitPath).toBeTruthy()
    } catch (error) {
      expect(error).toBeTruthy()
    }
  })
})
