/**
 * Created by Nasser on 9/3/2017.
 */
const PartFramework = require('partFramework');
const envMode = process.env.mode || process.env.MODE || 'dev';
const frameworkConfig = require('./project-config-' + envMode + '.js').frameworkConfig;

if (!process.env.hasOwnProperty('mode') && !process.env.hasOwnProperty('MODE')) {
  // eslint-disable-next-line no-console
  console.log('Warning!\nNo environment variable `mode` or `MODE` was provided.');
  // eslint-disable-next-line no-console
  console.log('Loading configurations for `dev` mood as default.\n\n');
}
new PartFramework(frameworkConfig).run();