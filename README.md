# Code Pipeline Sync Local

This action will load changed components into Code Pipeline on the mainframe from self-hosted runners. The runners should install Workbench CLI and be able to access the Code Pipeline host and port. This action supports Linux and Windows operating systems. 

## Table of Contents
<!-- toc -->

- [Usage](#usage)
- [Inputs](#inputs)
- [Outputs](#outputs)
- [Troubleshooting](#troubleshooting)
- [License](LICENSE.txt)

<!-- tocstop -->


## Usage

```yaml
  job_sync:
    runs-on: [self-hosted, win64]
    name: Code Pipeline Sync on self-hosted runners
    steps:
      - name: Checkout
        uses: actions/checkout@v2
        with:
          fetch-depth: 0
      - name: Synchronize
        uses: ./actions/ispw-sync-local
        id: sync-local
        with:
          host: 'host.example.com'
          port: 47623
          uid: 'ISPWUSER'
          pass: ${{ secrets.ISPW_USER1_PWD }}
          runtimeConfiguration: 'TPZP'
          stream: 'PLAY'
          application: 'PLAY'
          checkoutLevel: 'DEV2'
          gitUid: 'GitUserId'
          gitToken: ${{ secrets.GITHUB_TOKEN }}
          winTopazPath: ${{ Topaz_Location }}
          showEnv: true

```


## Inputs

| Input name | Required | Description |
| :--------- | :------- | :---------- |
| `host` | **Required** | The Code Pipeline server host. For example, `"cw09"` |
| `port` | **Required** | The Code Pipeline server port. For example, `47623` |
| `encryptionProtocol` | **Optional** | The encryption protocol for the connection (None, Auto, SSLv3, TLS, TLSv1, TLSv1.1, TLSv1.2). Default `"None"`
| `codePage` | **Optional** | The code page for the connection. default, `1047` |
| `timeout` | **Optional** | The timeout (in minutes) for the connection. Default, `0` |
| `uid` | **Required** | The user name for the Code Pipeline connection. For example, `"foo"` |
| `pass` | **Required** | The password for the Code Pipeline connection. Please use secrets, such as, `${{ secrets.ISPWPASS }}` |
| `runtimeConfiguration` | **Required** | The Code Pipeline server config. For example, `"TPZP"` |
| `stream` | **Required** | The Code Pipeline server stream. For example, `"PLAY"` |
| `application` | **Required** | The Code Pipeline server application. For example, `"PLAY"` |
| `subAppl` | **Optional** | The Code Pipeline server sub application. For example, `"PLAY"` |
| `checkoutLevel` | **Required** | The Code Pipeline server level. For example, `"DEV1"` |
| `gitUid` | **Required** | The user name for the GIT repository. For example, `"gitfoo"` |
| `gitToken` | **Required** | GitHub token, PAT, or password when not using GitHub API to calculate the changed files. Please use secrets, such as,  `${{ secrets.GITHUB_TOKEN }}` |
| `containerCreation` | **Optional** | The option to indicate how often to create a new Code Pipeline container (per-commit, per-branch). Default, `"per-commit"` |
| `containerDescription` | **Optional** | The custom description to be used for the Code Pipeline container. |
| `winTopazPath` |  **Optional** | Workbench CLI installed path on Window based self-hosted runner. |
| `unixTopazPath` |  **Optional** | Workbench CLI installed path on Unix based self-hosted runner. |
| `showEnv` | **Optional** | Show value of environment variables for debugging. Possible values are `true` or `false` |
| `assignmentPrefix` | **Optional** | The prefix to be used for the Code Pipeline container. For example, `"PLAY"` |
| `ispwConfigPath` | **Optional** | The path to Code Pipeline YAML configuration. For example, `"demo\ispwconfig.yml"` |
| `gitCommit` | **Optional** | The Git commit hash (long or short) or a colon-delimited list of file paths in the workspace. This input parameter needs to be used in combination with input parameter gitFromHash |
| `gitFromHash` | **Optional** | A Git hash to start syncing a list of commits which is not included in the sync, or -1 for multibranch project support. This input parameter needs to be used in combination with input parameter gitCommit|
| `gitBranch` | **Optional** | The target Git branch name|
| `gitCommitFile` | **Optional** | The name of a file which contains a colon-delimited list of file paths in the workspace|
| `gitRepoUrl` | **Optional** | Git Repository URL. By default it takes the URL of repository on which we are running our Github Action|
| `gitLocalPath` | **Optional** | The location of the local Git. By default it is set as Github Workspace Path|

## Outputs

| Output name | Output type | Description |
| :---------- | :---------- | :---------- |
| `automaticBuildJson` | JSON | The automatic build parameters JSON. For example, `{"containerId":"PLAY004807","releaseId":" ","taskLevel":"DEV2","taskIds":["7E54341E21FF","7E54341E2449","7E54341E2610"]}`|
| `changedProgramsJson` | JSON | The changed programs JSON. For example, `{ version: 1.0.0, programs: [ { version: 1.0.0, programName: TREXX10, programLanguage: CLST, isImpact: false, application: PLAY, stream: PLAY, level: DEV2 }, { version: 1.0.0, programName: TPROG10, programLanguage: COB, isImpact: false, application: PLAY, stream: PLAY, level: DEV2 }, { version: 1.0.0, programName: TPROG11, programLanguage: COB, isImpact: false, application: PLAY, stream: PLAY, level: DEV2 } ] }`|

## Troubleshooting

This action emits debug logs to help troubleshoot failure. To see the debug logs, set the input `showEnv: true`.
