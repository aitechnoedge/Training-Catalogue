import 'dotenv/config';
import {
  assertDatabaseEnvironmentIsSafe,
  assertStagingConfiguration,
  deploymentEnvironment,
} from '../server/deploymentEnvironment.mjs';

const target = deploymentEnvironment();

try {
  if (target === 'staging') {
    assertStagingConfiguration();
  } else if (target !== 'production' && target !== 'development') {
    assertDatabaseEnvironmentIsSafe();
  }
  console.log(`Deployment environment check passed for ${target}.`);
} catch (error) {
  console.error(`Deployment environment is not safe: ${error.message}`);
  process.exitCode = 1;
}
