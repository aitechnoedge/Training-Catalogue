import 'dotenv/config';
import { assertStagingConfiguration } from '../server/deploymentEnvironment.mjs';

try {
  assertStagingConfiguration();
  console.log('Staging configuration passed the isolation and completeness checks.');
} catch (error) {
  console.error(`Staging configuration is not deployable: ${error.message}`);
  process.exitCode = 1;
}
