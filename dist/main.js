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
const core = __importStar(require("@actions/core"));
const ispw_command_helper_1 = require("./ispw-command-helper");
const input_helper_1 = require("./input-helper");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const curWk = process.env.GITHUB_WORKSPACE;
            const parms = input_helper_1.getInputs();
            try {
                input_helper_1.validateInputs(parms);
                // eslint-disable-next-line no-shadow
            }
            catch (error) {
                if (error instanceof Error) {
                    core.debug(`${error.message}`);
                    throw error;
                }
            }
            let clipath = '';
            try {
                clipath = yield ispw_command_helper_1.getISPWCLIPath(parms);
                // eslint-disable-next-line no-shadow
            }
            catch (error) {
                if (error instanceof Error) {
                    core.debug(`${error.message}`);
                    throw error;
                }
            }
            try {
                yield ispw_command_helper_1.execISPWSync(clipath, parms, curWk);
                // eslint-disable-next-line no-shadow
            }
            catch (error) {
                if (error instanceof Error) {
                    core.debug(`${error.message}`);
                    throw error;
                }
            }
            core.info('Setting up the output values');
            const workpace = curWk !== null && curWk !== void 0 ? curWk : '';
            //Execution is completed
            try {
                //if (allowedCharsRegex.test(workpace)) {
                if (input_helper_1.checkForHarmfulCharAndWords(workpace)) {
                    // Normalize and resolve the workspace path to ensure it's absolute and sanitized
                    const resolvedWorkspace = path.resolve(path.normalize(workpace));
                    // Ensure the resolvedWorkspace is within the allowed base directory (GITHUB_WORKSPACE)
                    const baseWorkspace = path.resolve(path.normalize(process.env.GITHUB_WORKSPACE || ''));
                    const relativePath = path.relative(baseWorkspace, resolvedWorkspace);
                    // If relativePath starts with '..', it means resolvedWorkspace is outside the base directory
                    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
                        throw new Error('Potential path traversal detected!');
                    }
                    const autoBuildParms = path.join(resolvedWorkspace, 'automaticBuildParams.txt');
                    const realAutoBuildParms = fs.realpathSync(autoBuildParms);
                    // Ensure that autoBuildParms is within the resolvedWorkspace
                    const relativeAutoBuild = path.relative(resolvedWorkspace, realAutoBuildParms);
                    if (!relativeAutoBuild.startsWith('..') &&
                        !path.isAbsolute(relativeAutoBuild) &&
                        fs_1.existsSync(realAutoBuildParms)) {
                        const dataStr = fs_1.readFileSync(realAutoBuildParms, 'utf8');
                        core.setOutput('automaticBuildJson', dataStr);
                    }
                    else {
                        core.warning(`Path for autoBuildParms is not valid or does not exist: ${autoBuildParms}`);
                    }
                }
                else {
                    throw new Error(`Invalid path: The path contains disallowed characters or Harmful words. Please check workspace directory path`);
                }
                // eslint-disable-next-line no-shadow
            }
            catch (error) {
                if (error instanceof Error) {
                    core.info(`Failed to read file: automaticBuildParams.txt`);
                    core.info(error.message);
                }
            }
            try {
                const changedProgs = path.join(workpace, 'changedPrograms.json');
                if (fs_1.existsSync(changedProgs)) {
                    const dataStr = fs_1.readFileSync(changedProgs).toString('utf8');
                    core.setOutput('changedProgramsJson', dataStr);
                }
                // eslint-disable-next-line no-shadow
            }
            catch (error) {
                if (error instanceof Error) {
                    core.info(`Fail to read file: changedPrograms.json`);
                    core.info(error.message);
                }
            }
            core.info('ISPW Sync action is completed');
            // eslint-disable-next-line no-shadow
        }
        catch (error) {
            if (error instanceof Error) {
                core.setFailed(error.message);
            }
        }
    });
}
run();
//# sourceMappingURL=main.js.map