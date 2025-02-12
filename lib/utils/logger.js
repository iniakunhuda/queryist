const chalk = require('chalk');

class Logger {
  info(message, ...args) {
    console.log(chalk.blue('INFO:'), message, ...args);
  }

  success(message, ...args) {
    console.log(chalk.green('SUCCESS:'), message, ...args);
  }

  warn(message, ...args) {
    console.log(chalk.yellow('WARNING:'), message, ...args);
  }

  error(message, ...args) {
    console.error(chalk.red('ERROR:'), message, ...args);
  }
}

module.exports = new Logger();