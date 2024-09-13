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
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const curWk = process.env.GITHUB_WORKSPACE;
            const parms = input_helper_1.getInputs();
            let clipath = '';
            try {
                clipath = yield ispw_command_helper_1.getISPWCLIPath(parms);
            }
            catch (error) {
                if (error instanceof Error) {
                    core.debug(`${error.message}`);
                    throw error;
                }
            }
            try {
                yield ispw_command_helper_1.execISPWSync(clipath, parms, curWk);
            }
            catch (error) {
                if (error instanceof Error) {
                    core.debug(`${error.message}`);
                    throw error;
                }
            }
            core.info('Setting up the output values');
            const workpace = curWk !== null && curWk !== void 0 ? curWk : '';
            core.info('Old Code Start');
            //Execution is completed
            try {
                core.info('Workspace:' + workpace);
                const autoBuildParms = path.join(workpace, 'automaticBuildParams.txt');
                core.info('Autobuildparams:' + autoBuildParms);
                if (fs_1.existsSync(autoBuildParms)) {
                    const dataStr = fs_1.readFileSync(autoBuildParms).toString('utf8');
                    core.setOutput('automaticBuildJson', dataStr);
                }
            }
            catch (error) {
                if (error instanceof Error) {
                    core.info(`Fail to read file: automaticBuildParams.txt`);
                    core.info(error.message);
                }
            }
            core.info('Old Code End');
            core.info('New Code Start');
            try {
                // Normalize the workspace path to remove any dangerous characters like "../"
                core.info('Workspace' + workpace);
                const normalizedWorkpace = path.normalize(workpace);
                core.info('Normalized Workspace' + normalizedWorkpace);
                // Check if the resolved path is absolute. If not, throw an error
                if (!path.isAbsolute(normalizedWorkpace)) {
                    throw new Error('Invalid workspace path: Path must be absolute');
                }
                // Ensure that the normalized path doesn't escape to unintended directories (no "../" traversal)
                if (normalizedWorkpace.includes('..')) {
                    throw new Error('Potential path traversal detected!');
                }
                //const autoBuildParms = path.join(workpace, 'automaticBuildParams.txt')
                const autoBuildParms = path.join(normalizedWorkpace, 'automaticBuildParams.txt');
                core.info('Auto Build Parms' + autoBuildParms);
                if (fs_1.existsSync(autoBuildParms)) {
                    const dataStr = fs_1.readFileSync(autoBuildParms).toString('utf8');
                    core.setOutput('automaticBuildJson', dataStr);
                }
            }
            catch (error) {
                if (error instanceof Error) {
                    core.info(`Fail to read file: automaticBuildParams.txt`);
                    core.info(error.message);
                }
            }
            core.info('New Code End');
            try {
                const changedProgs = path.join(workpace, 'changedPrograms.json');
                if (fs_1.existsSync(changedProgs)) {
                    const dataStr = fs_1.readFileSync(changedProgs).toString('utf8');
                    core.setOutput('changedProgramsJson', dataStr);
                }
            }
            catch (error) {
                if (error instanceof Error) {
                    core.info(`Fail to read file: changedPrograms.json`);
                    core.info(error.message);
                }
            }
            core.info('ISPW Sync action is completed');
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