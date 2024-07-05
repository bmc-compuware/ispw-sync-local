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
exports.calculateDiff = exports.getGitPath = void 0;
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const io = __importStar(require("@actions/io"));
const github = __importStar(require("@actions/github"));
function execGit(gitPath, args, allowAllExitCodes = false, wkspace, silent = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = new GitCommandOutput();
        const env = {};
        const stdout = [];
        const options = {
            cwd: wkspace,
            env,
            silent,
            ignoreReturnCode: allowAllExitCodes,
            listeners: {
                stdout: (data) => {
                    const outdata = data.toString();
                    stdout.push(outdata);
                }
            }
        };
        core.debug(`Execute git ${gitPath} with ${args}, ${options}`);
        result.exitCode = yield exec.exec(gitPath, args, options);
        result.stdout = stdout.join('');
        return result;
    });
}
class GitCommandOutput {
    constructor() {
        this.stdout = '';
        this.exitCode = 0;
    }
}
function getGitPath() {
    return __awaiter(this, void 0, void 0, function* () {
        switch (process.platform) {
            case 'win32': {
                const gitPath = yield io.which('git.exe', true);
                core.debug(`Git path: ${gitPath}`);
                return gitPath;
            }
            case 'linux':
            case 'sunos': {
                const gitPath = yield io.which('git', true);
                core.debug(`Git Path: ${gitPath}`);
                return gitPath;
            }
            default:
                throw new Error(`Unsupported system found.`);
        }
    });
}
exports.getGitPath = getGitPath;
function calculateDiff(gitPath, commitid, wkspace) {
    return __awaiter(this, void 0, void 0, function* () {
        const context = github.context;
        if (!context) {
            throw new Error('Fail to retrieve the GitHub context');
        }
        const ref = context.ref;
        let baseref;
        let headref;
        let args = [];
        if (context && context.eventName === 'pull_request') {
            if (!context.payload.pull_request) {
                throw new Error('Fail to retrieve GitHub pull request');
            }
            baseref = context.payload.pull_request.base.sha;
            headref = context.payload.pull_request.head.sha;
            const shas = baseref.concat('..').concat(headref);
            if (baseref && headref) {
                core.debug(`Received GitHub information for pull request event: baseref= ${baseref}, headref= ${headref}, ref= ${ref} `);
                args = ['diff', '--name-only', shas];
            }
            else if (ref) {
                core.debug(`Received GitHub information for pull request event: baseref= ${baseref}, headref= ${headref},  ref= ${ref}`);
                args = ['diff-tree', '--no-commit-id', '--name-only', '-r', ref];
            }
        }
        else if (context && github.context.eventName === 'push') {
            if (!context.payload) {
                throw new Error('Fail to get GitHub push event payload');
            }
            baseref = context.payload.before;
            headref = context.payload.after;
            if (baseref && headref) {
                core.debug(`Received GitHub information for push event: baseref= ${baseref}, headref= ${headref}`);
                const shas = baseref.concat('..').concat(headref);
                args = ['diff', '--name-only', shas];
            }
            else if (ref) {
                core.debug(`Received GitHub information: baseref= ${baseref}, headref= ${headref},  ref= ${ref}`);
                args = ['diff-tree', '--no-commit-id', '--name-only', '-r', ref];
            }
        }
        else {
            let commit;
            if (!commitid && !ref) {
                throw new Error('Fall to get GitHub branch or tag ref');
            }
            if (ref) {
                commit = ref;
            }
            else {
                commit = commitid;
            }
            core.debug(`Received GitHub information:  ref= ${ref},  commitid = ${commitid}, Commit = ${commit}`);
            args = ['diff-tree', '--no-commit-id', '--name-only', '-r', commit];
        }
        if (args.length === 0) {
            throw new Error('Fail to retrieve the commit informaiton from GitHub');
        }
        else {
            const output = yield execGit(gitPath, args, true, wkspace, true);
            if (output) {
                let dataOutput = '';
                for (const line of output.stdout.trim().split('\n')) {
                    dataOutput = dataOutput.concat(line).concat(':');
                }
                if (dataOutput.endsWith(':')) {
                    dataOutput = dataOutput.substring(0, dataOutput.length - 1);
                }
                core.debug(`Changed files: ${dataOutput}`);
                return dataOutput;
            }
        }
        throw new Error('Unexpected error when calculcating the changed files');
    });
}
exports.calculateDiff = calculateDiff;
//# sourceMappingURL=git-command-helper.js.map