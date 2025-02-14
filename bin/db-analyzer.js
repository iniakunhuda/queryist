// bin/db-analyzer.js
const inquirer = require('inquirer');
const figlet = require('figlet');
const chalk = require('chalk');
const ora = require('ora');
const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const MySQLAnalyzer = require('../lib/analyzers/mysqlAnalyzer');
const PostgreSQLAnalyzer = require('../lib/analyzers/postgreAnalyzer');
const TerminalVisualizer = require('../lib/visualizers/terminalVisualizer');
const logger = require('../lib/utils/logger');
const { I18n } = require('../lib/i18n/translations');

// Initialize i18n
const i18n = new I18n('en');

async function selectLanguage() {
  const { language } = await inquirer.prompt([
    {
      type: 'list',
      name: 'language',
      message: 'Select language / Pilih bahasa:',
      choices: [
        { name: 'English', value: 'en' },
        { name: 'Bahasa Indonesia', value: 'id' }
      ]
    }
  ]);
  i18n.setLanguage(language);
  return language;
}

async function testConnection(type, config) {
  let connection;
  const spinner = ora(i18n.t('connection.testing')).start();

  try {
    const hostToUse = config.host === 'localhost' ? '127.0.0.1' : config.host;
    
    if (type === 'MySQL') {
      connection = await mysql.createConnection({
        host: hostToUse,
        port: config.port,
        user: config.username,
        password: config.password,
        authPlugins: {
          mysql_native_password: () => () => mysql.auth.mysql_native_password({password: config.password}),
          mysql_clear_password: () => () => mysql.auth.mysql_clear_password({password: config.password}),
        }
      });
      await connection.connect();

      const [databases] = await connection.query('SHOW DATABASES');
      const dbList = databases.map(db => db.Database).filter(
        db => !['information_schema', 'mysql', 'performance_schema', 'sys'].includes(db)
      );

      await connection.end();
      spinner.succeed(i18n.t('connection.success.mysql'));
      return dbList;

    } else if (type === 'PostgreSQL') {
      const pgConfig = {
        host: hostToUse,
        port: config.port,
        user: config.username,
        password: config.password,
        database: 'postgres', // Connect to default postgres database initially
        connectionTimeoutMillis: 5000
      };

      connection = new Pool(pgConfig);
      await connection.connect();

      // Get list of databases excluding system databases
      const result = await connection.query(`
        SELECT datname FROM pg_database 
        WHERE datistemplate = false 
        AND datname NOT IN ('postgres', 'template0', 'template1')
      `);
      const dbList = result.rows.map(row => row.datname);

      await connection.end();
      spinner.succeed(i18n.t('connection.success.postgresql'));
      return dbList;
    }
  } catch (error) {
    spinner.fail(`${i18n.t('connection.failed')}${error.message}`);
    logger.error('Detailed error:', error);
    
    if (error.code === 'ECONNREFUSED') {
      logger.info(`\n${i18n.t('errors.connection.solutions.title')}`);
      i18n.t('errors.connection.solutions.mysql').forEach(solution => logger.info(solution));
    } else if (error.message.includes('ER_ACCESS_DENIED_ERROR') || error.message.includes('password authentication failed')) {
      logger.info(`\n${i18n.t('errors.connection.solutions.title')}`);
      i18n.t('errors.connection.solutions.auth').forEach(solution => logger.info(solution));
    }
    throw new Error(`${i18n.t('connection.failed')}${error.message}`);
  } finally {
    if (connection) {
      if (type === 'MySQL') await connection.end();
      else await connection.end();
    }
  }
}

async function getSchemas(config) {
  const connection = new Pool({
    host: config.host === 'localhost' ? '127.0.0.1' : config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
    connectionTimeoutMillis: 5000
  });

  try {
    const result = await connection.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      AND schema_name NOT LIKE 'pg_%'
    `);
    return result.rows.map(row => row.schema_name);
  } finally {
    await connection.end();
  }
}

async function main() {
  // First, select language
  await selectLanguage();

  console.log(chalk.cyan(figlet.textSync(i18n.t('title'), { horizontalLayout: 'full' })));
  console.log(chalk.yellow(i18n.t('subtitle') + '\n'));

  try {
    const initialAnswers = await inquirer.prompt([
      {
        type: 'list',
        name: 'dbType',
        message: i18n.t('dbSelection.type'),
        choices: ['MySQL', 'PostgreSQL']
      },
      {
        type: 'input',
        name: 'host',
        message: i18n.t('dbSelection.host'),
        default: 'localhost'
      },
      {
        type: 'input',
        name: 'port',
        message: i18n.t('dbSelection.port'),
        default: answers => answers.dbType === 'MySQL' ? '3306' : '5432'
      },
      {
        type: 'input',
        name: 'username',
        message: i18n.t('dbSelection.username'),
        default: answers => answers.dbType === 'MySQL' ? 'root' : 'postgres'
      },
      {
        type: 'password',
        name: 'password',
        message: i18n.t('dbSelection.password'),
        mask: '*'
      }
    ]);

    let databases;
    try {
      databases = await testConnection(initialAnswers.dbType, initialAnswers);
    } catch (error) {
      logger.error(error.message);
      process.exit(1);
    }

    if (!databases || databases.length === 0) {
      logger.error(i18n.t('connection.noDb'));
      process.exit(1);
    }

    const dbAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'database',
        message: i18n.t('dbSelection.database'),
        choices: databases
      }
    ]);

    let schemaAnswer = {};
    if (initialAnswers.dbType === 'PostgreSQL') {
      const schemas = await getSchemas({ ...initialAnswers, ...dbAnswer });
      schemaAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'schema',
          message: i18n.t('dbSelection.schema'),
          choices: schemas,
          default: 'public'
        }
      ]);
    }

    const queryAnswer = await inquirer.prompt([
      {
        type: 'editor',
        name: 'query',
        message: i18n.t('dbSelection.query'),
        validate: input => input.trim().length > 0 ? true : i18n.t('errors.emptyQuery')
      }
    ]);

    const config = {
      ...initialAnswers,
      ...dbAnswer,
      ...schemaAnswer,
      ...queryAnswer
    };

    const spinner = ora(i18n.t('analysis.analyzing')).start();

    const hostToUse = config.host === 'localhost' ? '127.0.0.1' : config.host;
    let analyzer;
    
    if (config.dbType === 'MySQL') {
      analyzer = new MySQLAnalyzer({
        host: hostToUse,
        port: config.port,
        user: config.username,
        password: config.password,
        database: config.database
      }, i18n);
    } else {
      analyzer = new PostgreSQLAnalyzer({
        host: hostToUse,
        port: config.port,
        user: config.username,
        password: config.password,
        database: config.database,
        schema: config.schema
      }, i18n);
    }

    const result = await analyzer.analyze(config.query);
    spinner.succeed(i18n.t('analysis.complete'));

    const visualizer = new TerminalVisualizer(i18n);
    await visualizer.display(result);

  } catch (error) {
    logger.error(i18n.t('errors.analysis'), error.message);
    process.exit(1);
  }
}

main();