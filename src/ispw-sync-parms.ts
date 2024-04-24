export interface IISPWSyncParms {
  /**
   * The host name or IP to be connected
   */
  host: string

  /**
   * The port to be connected
   */
  port: number

  /**
   * The encryption protocol for the connection
   */
  encryptionProtocol: string

  /**
   * The code page for the connection
   */
  codePage: string

  /**
   * The timeout (in minutes) for the connection
   */
  timeout: number

  /**
   * Mainframe user ID
   */
  uid: string

  /**
   * Mainframe password
   */
  pass: string

  /**
   * Client certificate
   */
  certificate: string

  /**
   * Runtime configuration
   */
  runtimeConfiguration: string

  /**
   * The ISPW Stream name
   */
  stream: string

  /**
   * The ISPW Application
   */
  application: string

  /**
   * The ISPW Sub Application
   */
  subAppl: string

  /**
   * The ISPW Application
   */
  checkoutLevel: string
  /**
   * GitHub Repo Url
   */
  gitRepoUrl: string

  /**
   * GIT user ID
   */
  gitUid: string

  /**
   * GIT password
   */
  gitToken: string

  /**
   * The option to indicate how often to create a new ISPW container
   */
  containerCreation: string

  /**
   * The custom description to be used for the ISPW container
   */
  containerDescription: string

  /**
   * Show environment variables for debug purpose
   */
  showEnv: boolean

  /**
   * The Workbench CLI installed path on Window based self-hosted runner
   */
  winTopazPath: string

  /**
   * The Workbench CLI installed path on Linux/Sun Unix based self-hosted runner
   */
  unixTopazPath: string

  /**
   * current workspace
   */
  workspace: string

  /**
   * GitHub branch
   */
  gitBranch: string

  /**
   * Git commit
   */
  gitCommit: string

  /**
   * current Commit id
   */
  //curCommit: string

  /**
   * before Commit id
   */
  //beforeCommit: string

  ispwConfigPath: string

  assignmentPrefix: string

  gitFromHash: string
}
