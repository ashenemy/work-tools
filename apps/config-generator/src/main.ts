import { configToml } from './config/config.toml';
import TOML, { JsonMap } from '@iarna/toml';
import { ensureDir, writeFile } from 'fs-extra';
import { join } from 'node:path';


async function generate(): Promise<void> {
    const tomlConfigContent = TOML.stringify(configToml as JsonMap);
    const tomlConfigDir = join(__dirname, '..', 'dist');
    const tomlConfigPath = join(tomlConfigDir, 'config.toml');

    await ensureDir(tomlConfigDir);

    await writeFile(tomlConfigPath, tomlConfigContent);
}

void generate();