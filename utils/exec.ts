import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface ExecResult {
    stdout: string;
    stderr: string;
    code: number;
}

const execute = async (command: string, args: string[]): Promise<ExecResult> => {
    try {
        const result = await execFileAsync(command, args);
        return {
            stdout: result.stdout,
            stderr: result.stderr,
            code: 0
        };
    } catch (error: any) {
        return {
            stdout: error.stdout ?? "",
            stderr: error.stderr || error.message || "",
            code: typeof error.code === "number" ? error.code : 1
        };
    }
};

export default execute;