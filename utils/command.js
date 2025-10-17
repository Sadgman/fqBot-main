import { exec} from 'child_process';

export default async function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, {encoding: 'UTF-8', shell: false, windowsHide: true}, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout.toString('utf-8'));
            }
        });
    });
}   