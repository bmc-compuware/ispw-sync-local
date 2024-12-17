"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
exports.calculateChangedFiles = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
function calculateChangedFiles(parms) {
    return __awaiter(this, void 0, void 0, function* () {
        const gitHubToken = parms.gitToken;
        if (!gitHubToken) {
            throw new Error('GitHub Token is required');
        }
        const context = github.context;
        if (!context) {
            throw new Error('Fail to retrieve an invalid GitHub context');
        }
        const owner = context.repo.owner;
        const repo = context.repo.repo;
        const ref = context.ref;
        let baseref;
        let headref;
        const octokit = github.getOctokit(gitHubToken);
        if (context.eventName === 'pull_request') {
            if (!context.payload.pull_request) {
                throw new Error('Fail to retrieve GitHub pull request');
            }
            const pullRequestNumber = context.payload.pull_request.number;
            baseref = context.payload.pull_request.base.ref;
            headref = context.payload.pull_request.head.ref;
            if ((!baseref || !headref) && ref) {
                baseref = `${ref}^`;
                headref = ref;
            }
            core.debug(`Received GitHub information for pull request event: baseref= ${baseref}, headref= ${headref}, pullRequestNumber= ${pullRequestNumber}, ref= ${ref}, owner= ${owner}, repo= ${repo}`);
        }
        else if (github.context.eventName === 'push') {
            if (!context.payload) {
                throw new Error('Fall to get GitHub push event payload');
            }
            baseref = context.payload.before;
            headref = context.payload.after;
            if ((!baseref || !headref) && ref) {
                baseref = `${ref}^`;
                headref = ref;
            }
            core.info(`Received GitHub information for push event: baseref= ${baseref}, headref= ${headref}, ref= ${ref}, owner= ${owner}, repo= ${repo}`);
        }
        else {
            if (!ref) {
                throw new Error('Fail to retrieve GitHub branch or tag ref');
            }
            baseref = `${ref}^`;
            headref = ref;
        }
        core.info(`Received GitHub information: baseref= ${baseref}, headref= ${headref},  ref= ${ref}`);
        if (!owner || !repo || !baseref || !headref) {
            throw new Error('Fail to retrieve GitHub context information to calculate the changed files');
        }
        const options = {
            owner,
            repo,
            base: baseref,
            head: headref
        };
        core.info('Calling GitHub API to calculate changed files');
        const response = yield octokit.repos.compareCommits(options);
        core.debug(JSON.stringify(response));
        if (!response || !response.data) {
            throw new Error('Unexpected error when calculcating the changed files with GitHub API');
        }
        const files = response.data.files;
        if (files) {
            let fileNameStr = '';
            const fileNames = files.map(f => f.filename.concat(':'));
            if (fileNames) {
                for (const afile of fileNames) {
                    fileNameStr = fileNameStr.concat(afile);
                }
                if (fileNameStr.endsWith(':')) {
                    fileNameStr = fileNameStr.substring(0, fileNameStr.length - 1);
                }
                core.debug(`Changed files: ${fileNameStr}`);
            }
            return fileNameStr;
        }
        throw new Error('Unexpected error when calculcating the changed files with GitHub API');
    });
}
exports.calculateChangedFiles = calculateChangedFiles;
//# sourceMappingURL=github-restapi-helper.js.map