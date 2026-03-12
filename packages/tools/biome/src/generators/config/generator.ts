import { posix as path } from 'node:path';
import {
    formatFiles,
    getProjects,
    joinPathFragments,
    type ProjectConfiguration,
    type TargetConfiguration,
    type Tree,
    updateJson,
} from '@nx/devkit';
import type { ConfigGeneratorSchema } from './@types';

const BIOME_CHECK_TARGET_NAME = 'check';
const BIOME_CHECK_FIX_TARGET_NAME = 'check-fix';
const BIOME_CHECK_EXECUTOR = '@work-tools/nx-biome:check';

const BIOME_SCHEMA_PATH = 'node_modules/@biomejs/biome/configuration_schema.json';
const ROOT_BIOME_CONFIG_PATH = 'biome.json';

const normalizeRelativePath = (value: string): string => {
    if (value === '') {
        return '.';
    }

    return value;
};

const resolveProjectRelativePath = (projectRoot: string, targetPath: string): string => {
    const relativeRootPath = normalizeRelativePath(path.relative(projectRoot, '.'));

    return joinPathFragments(relativeRootPath, targetPath);
};

const getBiomeConfigContent = (projectRoot: string): string => {
    return `${JSON.stringify(
        {
            $schema: resolveProjectRelativePath(projectRoot, BIOME_SCHEMA_PATH),
            extends: [resolveProjectRelativePath(projectRoot, ROOT_BIOME_CONFIG_PATH)],
            files: { includes: ['**'] },
            root: false,
        },
        null,
        2,
    )}\n`;
};

const ensureProjectExists = (tree: Tree, projectName: string): ProjectConfiguration => {
    const project = getProjects(tree).get(projectName);

    if (!project) {
        throw new Error(`Nx project "${projectName}" not found`);
    }

    return project;
};

const normalizeOptions = (options: ConfigGeneratorSchema): ConfigGeneratorSchema => {
    const projectName = options.projectName.trim();

    if (!projectName) {
        throw new Error('projectName must not be empty');
    }

    return { projectName };
};

const getBiomeConfigPath = (projectRoot: string): string => {
    return joinPathFragments(projectRoot, 'biome.json');
};

const writeBiomeConfig = (tree: Tree, projectRoot: string): void => {
    tree.write(getBiomeConfigPath(projectRoot), getBiomeConfigContent(projectRoot));
};

const getBiomeCheckTarget = (currentTarget?: TargetConfiguration): TargetConfiguration => {
    if (currentTarget?.executor && currentTarget.executor !== BIOME_CHECK_EXECUTOR) {
        throw new Error(`Nx project already has "${BIOME_CHECK_TARGET_NAME}" target with executor "${currentTarget.executor}"`);
    }

    return { executor: BIOME_CHECK_EXECUTOR };
};

const getBiomeCheckFixTarget = (currentTarget?: TargetConfiguration): TargetConfiguration => {
    if (currentTarget?.executor && currentTarget.executor !== BIOME_CHECK_EXECUTOR) {
        throw new Error(`Nx project already has "${BIOME_CHECK_FIX_TARGET_NAME}" target with executor "${currentTarget.executor}"`);
    }

    return { executor: BIOME_CHECK_EXECUTOR, options: { fix: true } };
};

const updateBiomeCheckTarget = (tree: Tree, project: ProjectConfiguration): void => {
    const projectJsonPath = joinPathFragments(project.root, 'project.json');
    const packageJsonPath = joinPathFragments(project.root, 'package.json');
    const configPath = tree.exists(projectJsonPath) ? projectJsonPath : packageJsonPath;

    if (!tree.exists(configPath)) {
        throw new Error(`Project configuration file not found for project root "${project.root}"`);
    }

    updateJson(tree, configPath, (json) => {
        const rootConfig = json as {
            nx?: { targets?: Record<string, TargetConfiguration> };
            targets?: Record<string, TargetConfiguration>;
        };

        if (configPath === projectJsonPath) {
            rootConfig.targets = {
                ...(rootConfig.targets ?? {}),
                [BIOME_CHECK_TARGET_NAME]: getBiomeCheckTarget(rootConfig.targets?.[BIOME_CHECK_TARGET_NAME]),
                [BIOME_CHECK_FIX_TARGET_NAME]: getBiomeCheckFixTarget(rootConfig.targets?.[BIOME_CHECK_FIX_TARGET_NAME]),
            };

            return rootConfig;
        }

        rootConfig.nx ??= {};
        rootConfig.nx.targets = {
            ...(rootConfig.nx.targets ?? {}),
            [BIOME_CHECK_TARGET_NAME]: getBiomeCheckTarget(rootConfig.nx.targets?.[BIOME_CHECK_TARGET_NAME]),
            [BIOME_CHECK_FIX_TARGET_NAME]: getBiomeCheckFixTarget(rootConfig.nx.targets?.[BIOME_CHECK_FIX_TARGET_NAME]),
        };

        return rootConfig;
    });
};

export default async function generator(tree: Tree, options: ConfigGeneratorSchema): Promise<void> {
    const normalizedOptions = normalizeOptions(options);
    const project = ensureProjectExists(tree, normalizedOptions.projectName);

    writeBiomeConfig(tree, project.root);
    updateBiomeCheckTarget(tree, project);

    await formatFiles(tree);
}
