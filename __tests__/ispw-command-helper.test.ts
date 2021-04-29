import {quoteArg, getISPWCLIPath} from '../src/ispw-command-helper'
import * as process from 'process'
import * as path from 'path'
import {IISPWSyncParms} from '../src/ispw-sync-parms'

test('quote a argument with spaces ', async () => {
  const input = 'test test'
  await expect(quoteArg(true, input)).toBe(`"${input}"`)
})

test('quote a argument with tab ', async () => {
  const input = 'test test'
  await expect(quoteArg(true, input)).toBe(`"${input}"`)
})

test('quote a argument with quotes ', async () => {
  const input = 'test"test'
  await expect(quoteArg(true, input)).toBe(`"${input}"`)
})

test('quote a argument when it is not truthy ', async () => {
  let input
  await expect(quoteArg(true, input)).toBe('')
})

describe('Test ISPW SYNC', () => {
  let result = ({} as unknown) as IISPWSyncParms

  beforeEach(() => {
    result.workspace =
      'D:\\64workspace\\localtest\\github-window-runner-test-repo'

    result.host = 'cw09'
    result.port = 47623

    result.runtimeConfiguration = 'TPZP'
    result.stream = 'PLAY'
    result.application = 'PLAY'
    result.checkoutLevel = 'DEV2'

    result.winTopazPath = 'C:\\Topaz\\WorkbenchCLI11'
    result.unixTopazPath = 'opt\test'
    // users need make sure Topaz CLI is installed at the same path

    result.showEnv = true
  })

  test('invalid inputs', () => {
    return getISPWCLIPath(result).catch(e => expect(e).toBeTruthy())
  })
})
