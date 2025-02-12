// lib/visualizers/terminalVisualizer.js
const chalk = require('chalk');
const Table = require('cli-table3');
const logger = require('../utils/logger');

class TerminalVisualizer {
    constructor(i18n) {
        this.i18n = i18n;
    }

    async display(result) {
        try {
            this.displayHeader(this.i18n.t('visualization.headers.results'));

            // Display query
            this.displayQuery(result.query);

            // Display execution plan
            this.displayExecutionPlan(result.executionPlan);

            // Display table statistics
            this.displayTableStatistics(result.tableStatistics);

            // Display existing indexes
            this.displayIndexes(result.indexes);

            // Display recommendations if any
            if (result.recommendations && result.recommendations.length > 0) {
                this.displayRecommendations(result.recommendations);
            }
        } catch (error) {
            logger.error(this.i18n.t('errors.display'), error.message);
        }
    }

    displayHeader(text) {
        console.log('\n' + chalk.cyan.bold('='.repeat(50)));
        console.log(chalk.cyan.bold(text));
        console.log(chalk.cyan.bold('='.repeat(50)) + '\n');
    }

    displayQuery(query) {
        this.displayHeader(this.i18n.t('visualization.headers.query'));
        console.log(chalk.white(query));
    }

    displayExecutionPlan(plan) {
        this.displayHeader(this.i18n.t('visualization.headers.plan'));

        const table = new Table({
            head: [
                this.i18n.t('visualization.table.operation'),
                this.i18n.t('visualization.table.cost'),
                this.i18n.t('visualization.table.rows'),
                this.i18n.t('visualization.table.details')
            ].map(h => chalk.yellow(h)),
            style: { head: [], border: [] }
        });

        if (plan && typeof plan === 'object') {
            this.formatExecutionPlan(plan, 0, table);
        } else {
            table.push([this.i18n.t('visualization.noData.plan'), 'N/A', 'N/A', 'N/A']);
        }

        console.log(table.toString());
    }

    formatExecutionPlan(node, level, table) {
        if (!node) return;

        const indent = '  '.repeat(level);

        const operation = node.select_type || 'SIMPLE';
        const cost = node.rows ? `${node.rows} rows` : 'N/A';
        const rowsEstimate = node.rows || 'N/A';
        let details = [];

        if (node.table) details.push(`table=${node.table}`);
        if (node.type) details.push(`type=${node.type}`);
        if (node.possible_keys) details.push(`possible_keys=${node.possible_keys}`);
        if (node.key) details.push(`key=${node.key}`);
        if (node.Extra) details.push(node.Extra);

        table.push([
            indent + operation,
            cost,
            rowsEstimate,
            details.join(', ') || 'N/A'
        ]);

        const children = node.Plans || node.children || [];
        if (Array.isArray(children)) {
            children.forEach(child => this.formatExecutionPlan(child, level + 1, table));
        }
    }

    displayTableStatistics(stats) {
        this.displayHeader(this.i18n.t('visualization.headers.stats'));

        const table = new Table({
            head: [
                this.i18n.t('visualization.table.table'),
                this.i18n.t('visualization.table.rows'),
                this.i18n.t('visualization.table.size'),
                this.i18n.t('visualization.table.indexSize')
            ].map(h => chalk.yellow(h)),
            style: { head: [], border: [] }
        });

        if (Array.isArray(stats) && stats.length > 0) {
            stats.forEach(stat => {
                if (stat) {
                    table.push([
                        stat.TABLE_NAME || stat.table_name || 'N/A',
                        stat.TABLE_ROWS || stat.table_rows || 'N/A',
                        this.formatBytes(stat.DATA_LENGTH || stat.data_length || 0),
                        this.formatBytes(stat.INDEX_LENGTH || stat.index_length || 0)
                    ]);
                }
            });
        } else {
            table.push([this.i18n.t('visualization.noData.stats'), 'N/A', 'N/A', 'N/A']);
        }

        console.log(table.toString());
    }

    displayIndexes(indexes) {
        this.displayHeader(this.i18n.t('visualization.headers.indexes'));

        const table = new Table({
            head: [
                this.i18n.t('visualization.table.table'),
                this.i18n.t('visualization.table.indexName'),
                this.i18n.t('visualization.table.columns'),
                this.i18n.t('visualization.table.type')
            ].map(h => chalk.yellow(h)),
            style: { head: [], border: [] }
        });

        if (Array.isArray(indexes) && indexes.length > 0) {
            indexes.forEach(index => {
                if (index) {
                    let columns = 'N/A';
                    let type = 'N/A';

                    columns = index.COLUMN_NAME || index.column_name || 'N/A';
                    type = (index.NON_UNIQUE !== undefined) ?
                        (index.NON_UNIQUE === 1 ? 'Non-Unique' : 'Unique') :
                        (index.non_unique ? 'Non-Unique' : 'Unique');

                    table.push([
                        index.TABLE_NAME || index.table_name || 'N/A',
                        index.INDEX_NAME || index.index_name || 'N/A',
                        columns,
                        type
                    ]);
                }
            });
        } else {
            table.push([this.i18n.t('visualization.noData.indexes'), '-', '-', '-']);
        }

        console.log(table.toString());
    }

    displayRecommendations(recommendations) {
        this.displayHeader(this.i18n.t('visualization.headers.recommendations'));

        if (Array.isArray(recommendations) && recommendations.length > 0) {
            recommendations.forEach(rec => {
                const color = this.getSeverityColor(rec.severity);
                console.log(color(`[${rec.type}] Severity: ${rec.severity}`));
                console.log(chalk.white(`Message: ${rec.message}`));
                console.log(chalk.green(`Suggestion: ${rec.suggestion}`));

                // Display detailed information if available
                if (rec.details) {
                    console.log(chalk.yellow(`Impact: ${rec.details.impact}`));
                    if (rec.details.implementation) {
                        console.log(chalk.blue('Implementation steps:'));
                        rec.details.implementation.forEach(step => console.log(chalk.blue(`  - ${step}`)));
                    }
                }
                console.log();
            });
        } else {
            console.log(chalk.yellow(this.i18n.t('visualization.noData.recommendations')));
        }
    }

    getSeverityColor(severity) {
        switch (severity?.toUpperCase()) {
            case 'HIGH':
                return chalk.red;
            case 'MEDIUM':
                return chalk.yellow;
            case 'LOW':
                return chalk.blue;
            default:
                return chalk.white;
        }
    }

    formatBytes(bytes) {
        if (!bytes || isNaN(bytes)) return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    }
}

module.exports = TerminalVisualizer;