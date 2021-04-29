# BMC/Compuware ISPW Sync GitHub action

This action will load changed components into ISPW server from self-hosted runners. The runners should install Topaz CLI and be able to access ISPW host and port. Supported Linux and Windows operating systems. 

## Table of Contents
<!-- toc -->

- [BMC/Compuware ISPW Sync Local GitHub action](#bmccompuware-ispw-sync-local-github-action)
  - [Table of Contents](#table-of-contents)
  - [Usage](#usage)
  - [Inputs](#inputs)
  - [Outputs](#outputs)
  - [Troubleshooting](#troubleshooting)
  - [License summary](#license-summary)
  - [Limitation](#limitation)

<!-- tocstop -->


## Usage

```yaml
  job_sync:
    runs-on: [self-hosted, win64]
    name: ISPW Sync on self-hosted runners
    steps:
      - name: Checkout
        uses: actions/checkout@v2
        with:
          fetch-depth: 0
      - name: Synchronize
        uses: ./actions/ispw-sync-local
        id: sync-local
        with:
          host: 'cw09.compuware.com'
          port: 47623
          uid: 'ISPWUSER'
          pass: ${{ secrets.ISPW_USER1_PWD }}
          runtimeConfiguration: 'TPZP'
          stream: 'PLAY'
          application: 'PLAY'
          checkoutLevel: 'DEV2'
          gitUid: 'GitUserId'
          gitPass: ${{ secrets.GIT_USER_PWD }}
          token: ${{ secrets.GITHUB_TOKEN }}
          winTopazPath: ${{ Topaz_Location }}
          showEnv: true

```


## Inputs

| Input name | Required | Description |
| :--------- | :------- | :---------- |
| `host` | **Required** | The ISPW server host. For example, `"cw09"` |
| `port` | **Required** | The ISPW server port. For example, `47623` |
| `encryptionProtocol` | **Optional** | The encryption protocol for the connection (None, Auto, SSLv3, TLS, TLSv1, TLSv1.1, TLSv1.2). Default `"None"`
| `codePage` | **Optional** | The code page for the connection. default, `1047` |
| `timeout` | **Optional** | The timeout (in minutes) for the connection. Default, `0` |
| `uid` | **Required** | The user name for the ISPW connection. For example, `"foo"` |
| `pass` | **Required** | The password for the ISPW connection. Please use secrets, such as, `${{ secrets.ISPWPASS }}` |
| `runtimeConfiguration` | **Required** | The ISPW server config. For example, `"TPZP"` |
| `stream` | **Required** | The ISPW server stream. For example, `"PLAY"` |
| `application` | **Required** | The ISPW server application. For example, `"PLAY"` |
| `checkoutLevel` | **Required** | The ISPW server level. For example, `"DEV1"` |
| `gitUid` | **Required** | The user name for the GIT repository. For example, `"gitfoo"` |
| `gitPass` | **Required** | The password for the GIT repository. Please use secrets, such as, `${{ secrets.GITPASS }}` |
| `containerCreation` | **Optional** | The option to indicate how often to create a new ISPW container (per-commit, per-branch). Default, `"per-commit"` |
| `containerDescription` | **Optional** | The custom description to be used for the ISPW container. |
| `token` |  **Optional** | GitHub Token provided by GitHub when using GitHub API to calculate the changed files. Set the value to ${{ secrets.GITHUB_TOKEN }}|
| `winTopazPath` |  **Optional** | Topaz CLI installed path on Window based self-hosted runner. |
| `unixTopazPath` |  **Optional** | Topaz CLI installed path on Unix based self-hosted runner. |
| `showEnv` | **Optional** | Show value of environment variables for debugging. Possible values are `true` or `false` |

## Outputs

| Output name | Output type | Description |
| :---------- | :---------- | :---------- |
| `automaticBuildJson` | JSON | The automatic build parameters JSON. For example, `{"containerId":"PLAY004807","releaseId":" ","taskLevel":"DEV2","taskIds":["7E54341E21FF","7E54341E2449","7E54341E2610"]}`|
| `changedProgramsJson` | JSON | The changed programs JSON. For example, `{ version: 1.0.0, programs: [ { version: 1.0.0, programName: TREXX10, programLanguage: CLST, isImpact: false, application: PLAY, stream: PLAY, level: DEV2 }, { version: 1.0.0, programName: TPROG10, programLanguage: COB, isImpact: false, application: PLAY, stream: PLAY, level: DEV2 }, { version: 1.0.0, programName: TPROG11, programLanguage: COB, isImpact: false, application: PLAY, stream: PLAY, level: DEV2 } ] }`|

## Troubleshooting

This action emits debug logs to help troubleshoot failure. To see the debug logs, set the input `showEnv: true`.

## License summary

This code is made available under the MIT license.

## Limitation



