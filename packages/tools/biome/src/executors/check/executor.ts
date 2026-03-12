import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { ExecutorContext } from '@nx/devkit';
import { createProjectGraphAsync, readCachedProjectGraph, workspaceRoot } from '@nx/devkit';
import { execa } from 'execa';
import type { CheckExecutorSchema } from './@types';

type NxProjectNode = { data?: { root?: string } };

type NxProjectGraph = { nodes: Record<string, NxProjectNode> };

const getProjectGraph = async (): Promise<NxProjectGraph> => {
    try {
        return readCachedProjectGraph() as NxProjectGraph;
    } catch {
        return (await createProjectGraphAsync()) as NxProjectGraph;
    }
};

const getProjectRoot = async (projectName: string): Promise<string> => {
    const projectGraph = await getProjectGraph();
    const projectNode = projectGraph.nodes[projectName];

    if (!projectNode?.data?.root) {
        throw new Error(`Nx project "${projectName}" not found`);
    }

    return join(workspaceRoot, projectNode.data.root);
};

const getBiomeBinPath = (): string => {
    return join(workspaceRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'biome.cmd' : 'biome');
};

const getBiomeArgs = (targetPath: string, fix: boolean): string[] => {
    if (fix) {
        return ['check', '--write', targetPath];
    }

    return ['check', targetPath];
};

const resolveProjectName = (options: CheckExecutorSchema, context: ExecutorContext): string => {
    const projectName = options.projectName ?? context.projectName;

    if (!projectName) {
        throw new Error('projectName is required when executor runs outside Nx project context');
    }

    return projectName;
};

const runBiomeCheck = async (options: CheckExecutorSchema, context: ExecutorContext): Promise<void> => {
    const projectRoot = await getProjectRoot(resolveProjectName(options, context));
    const biomeBinPath = getBiomeBinPath();
    const projectBiomeConfigPath = ['biome.json', 'biome.jsonc']
        .map((fileName) => join(projectRoot, fileName))
        .find((configPath) => existsSync(configPath));
    const cwd = projectBiomeConfigPath ? projectRoot : workspaceRoot;
    const targetPath = projectBiomeConfigPath ? '.' : relative(workspaceRoot, projectRoot).replaceAll('\\', '/');
    const biomeArgs = getBiomeArgs(targetPath, options.fix ?? false);

    await execa(biomeBinPath, biomeArgs, { cwd, stdio: 'inherit' });
};

const executor = async (options: CheckExecutorSchema, context: ExecutorContext): Promise<{ success: boolean }> => {
    try {
        await runBiomeCheck(options, context);

        return { success: true };
    } catch (error) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error('Biome check failed');
        }

        return { success: false };
    }
};

export default executor;
