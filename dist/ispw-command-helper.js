"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.quoteArg = exports.execISPWSync = exports.getISPWCLIPath = void 0;
const core = __importStar(require("@actions/core"));
const exec_1 = require("@actions/exec");
const io = __importStar(require("@actions/io"));
const path = __importStar(require("path"));
const fs_1 = require("fs");
const gitCommand = __importStar(require("./git-command-helper"));
const github_restapi_helper_1 = require("./github-restapi-helper");
const fs = __importStar(require("fs"));
function getISPWCLIPath(parms) {
    return __awaiter(this, void 0, void 0, function* () {
        let topazCLIPath = '';
        switch (process.platform) {
            case 'win32': {
                topazCLIPath = parms.winTopazPath;
                topazCLIPath = path.join(topazCLIPath, 'IspwCLI.bat');
                topazCLIPath = path.normalize(topazCLIPath);
                core.debug(`Workbench CLI Path: '${topazCLIPath}'`);
                if (fs_1.existsSync(topazCLIPath)) {
                    return topazCLIPath;
                }
                else {
                    throw new Error(`Unable to locate IspwCLI.bat. Please verify the file path '${topazCLIPath}' exists`);
                }
            }
            case 'linux':
            case 'sunos': {
                topazCLIPath = parms.unixTopazPath;
                topazCLIPath = path.join(topazCLIPath, 'IspwCLI.sh');
                topazCLIPath = path.normalize(topazCLIPath);
                core.debug(`Workbench CLI Path: ${topazCLIPath}`);
                if (fs_1.existsSync(topazCLIPath)) {
                    return topazCLIPath;
                }
                else {
                    throw new Error(`Unable to locate IspwCLI.sh. Please verify the file path '${topazCLIPath}' exists`);
                }
            }
            default:
                throw new Error(`Unsupported system found.`);
        }
    });
}
exports.getISPWCLIPath = getISPWCLIPath;
function execISPWSync(cliPath, parms, cwd) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            core.info('Start ISPW Sync action');
            if (!parms || !cwd) {
                core.debug('Fail to get input values or environment settings');
                throw new Error(`Fail to get input values or environment settings`);
            }
            // Resolve the workspace to an absolute and canonical path to prevent directory traversal
            core.info('Jalaj parms.workspace:' + parms.workspace);
            const curWorkspace = fs.realpathSync(path.resolve(parms.workspace));
            core.info('Jalaj curWorkspace:' + curWorkspace);
            // Define paths
            const configPath = path.join(curWorkspace, 'ispwcliwk');
            const changedPrograms = path.join(curWorkspace, 'changedPrograms.json');
            const autoBuildParms = path.join(curWorkspace, 'automaticBuildParams.txt');
            const tempHash = path.join(curWorkspace, 'toHash.txt');
            core.info('Jalaj configPath:' + configPath);
            core.info('Jalaj changedPrograms:' + changedPrograms);
            core.info('Jalaj autoBuildParms:' + autoBuildParms);
            core.info('Jalaj tempHash:' + tempHash);
            // Function to check if a file's real path is within the allowed directory
            const isPathWithinWorkspace = (filePath) => {
                core.info('Jalaj filePath:' + filePath);
                const realPath = fs.realpathSync(filePath);
                core.info('Jalaj RealPath:' + realPath);
                core.info('Jalaj Returned:' + realPath.startsWith(curWorkspace));
                return realPath.startsWith(curWorkspace);
            };
            // Check and create directory if it does not exist
            if (!fs_1.existsSync(configPath)) {
                yield io.mkdirP(configPath);
                core.info('Jalaj Directory created:' + configPath);
                core.debug(`Directory created: ${configPath}`);
            }
            else {
                core.info('Jalaj Directory exists:' + configPath);
                core.debug(`Directory exists: ${configPath}`);
            }
            // Check and remove changedPrograms file
            if (fs_1.existsSync(changedPrograms)) {
                if (isPathWithinWorkspace(changedPrograms)) {
                    core.info(`Check file: ${changedPrograms}`);
                    try {
                        fs_1.unlinkSync(changedPrograms);
                        core.info(`Removed obsolete file: ${changedPrograms}`);
                    }
                    catch (error) {
                        if (error instanceof Error) {
                            core.warning(`Error during file removal: ${error.message}`);
                        }
                    }
                }
                else {
                    core.error(`Potential path manipulation detected in changedPrograms: ${changedPrograms}`);
                    throw new Error("Invalid path for changedPrograms");
                }
            }
            else {
                core.warning(`File does not exist: ${changedPrograms}`);
            }
            // Check and remove autoBuildParms file
            if (fs_1.existsSync(autoBuildParms)) {
                if (isPathWithinWorkspace(autoBuildParms)) {
                    core.info(`Check file: ${autoBuildParms}`);
                    try {
                        fs_1.unlinkSync(autoBuildParms);
                        core.info(`Removed obsolete file: ${autoBuildParms}`);
                    }
                    catch (error) {
                        if (error instanceof Error) {
                            core.warning(`Error during file removal: ${error.message}`);
                        }
                    }
                }
                else {
                    core.error(`Potential path manipulation detected in autoBuildParms: ${autoBuildParms}`);
                    throw new Error("Invalid path for autoBuildParms");
                }
            }
            else {
                core.warning(`File does not exist: ${autoBuildParms}`);
            }
            // Check and remove tempHash file
            if (fs_1.existsSync(tempHash)) {
                if (isPathWithinWorkspace(tempHash)) {
                    core.info(`Check file: ${tempHash}`);
                    try {
                        fs_1.unlinkSync(tempHash);
                        core.info(`Removed obsolete file: ${tempHash}`);
                    }
                    catch (error) {
                        if (error instanceof Error) {
                            core.warning(`Error during file removal: ${error.message}`);
                        }
                    }
                }
                else {
                    core.error(`Potential path manipulation detected in tempHash: ${tempHash}`);
                    throw new Error("Invalid path for tempHash");
                }
            }
            else {
                core.warning(`File does not exist: ${tempHash}`);
            }
            let gitPath;
            try {
                gitPath = yield gitCommand.getGitPath();
            }
            catch (error) {
                // do nothing
            }
            let changedFileList = undefined;
            if (gitPath) {
                gitPath = path.resolve(gitPath);
                changedFileList = yield gitCommand.calculateDiff('git', parms.gitCommit, curWorkspace);
            }
            else {
                changedFileList = yield github_restapi_helper_1.calculateChangedFiles(parms);
            }
            if (!changedFileList || changedFileList.length <= 1) {
                core.info('There is no changed files found.');
                return;
            }
            else {
                if (changedFileList.length > 2048) {
                    const writeStream = fs_1.createWriteStream(tempHash);
                    writeStream.write(changedFileList);
                    writeStream.end();
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
                parms.gitFromHash,
                '-targetFolder',
                parms.workspace,
                '-ispwContainerCreation',
                parms.containerCreation,
                '-gitLocalPath',
                parms.gitLocalPath
            ];
            if (parms.subAppl) {
                args.push('-ispwServerSubAppl');
                args.push(parms.subAppl);
            }
            if (parms.assignmentPrefix) {
                args.push('-assignmentPrefix');
                args.push(parms.assignmentPrefix);
            }
            if (parms.ispwConfigPath) {
                args.push('-ispwConfigPath');
                args.push(parms.ispwConfigPath);
            }
            if (typeof parms.certificate != 'undefined' && parms.certificate) {
                args.push('-certificate');
                args.push(parms.certificate);
            }
            else {
                args.push('-id');
                args.push(parms.uid);
                args.push('-pass');
                args.push(parms.pass);
            }
            if (parms.timeout) {
                args.push('-timeout');
                args.push(parms.timeout.toString());
            }
            if (parms.codePage) {
                args.push('-code');
                args.push(parms.codePage);
            }
            if (parms.encryptionProtocol) {
                args.push('-protocol');
                args.push(parms.encryptionProtocol);
            }
            if (parms.containerDescription) {
                args.push('-ispwContainerDescription');
                args.push(parms.containerDescription);
            }
            const gitCommit = core.getInput('gitCommit');
            if (changedFileList.length > 2048) {
                args.push('-gitCommitFile');
                args.push(tempHash);
            }
            else if (gitCommit) {
                args.push('-gitCommit');
                args.push(parms.gitCommit);
            }
            else {
                args.push('-gitCommit');
                changedFileList = quoteArg(false, changedFileList);
                args.push(changedFileList);
            }
            if (parms.gitCommitFile) {
                args.push('-gitCommitFile');
                args.push(parms.gitCommitFile);
            }
            cwd = quoteArg(true, cwd);
            cliPath = quoteArg(true, cliPath);
            core.debug(`Code Pipeline CLI parms: ${parms}`);
            yield exec_1.exec(cliPath, args, { cwd });
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error: ${error.message}`);
            }
        }
    });
}
exports.execISPWSync = execISPWSync;
function quoteArg(escape, arg) {
    if (!arg) {
        return '';
    }
    if (process.platform === 'linux' || process.platform === 'sunos' || escape) {
        const cmdSpecialChars = [' ', '\t', '"', "'"];
        let needsQuotes = false;
        for (const char of arg) {
            if (cmdSpecialChars.some(x => x === char)) {
                needsQuotes = true;
                break;
            }
        }
        if (needsQuotes) {
            arg = `"${arg}"`;
            core.debug(`Quote the value '${arg}' `);
        }
    }
    return arg;
}
exports.quoteArg = quoteArg;
//# sourceMappingURL=ispw-command-helper.js.map