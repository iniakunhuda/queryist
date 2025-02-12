// lib/analyzers/mysqlAnalyzer.js
const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

class MySQLAnalyzer {
    constructor(config, i18n) {
        this.config = config;
        this.i18n = i18n;
    }

    async analyze(query) {
        let connection;
        try {
            // Create connection
            connection = await mysql.createConnection({
                ...this.config,
                // Add query timeout
                connectTimeout: 10000,
                // Support multiple statements
                multipleStatements: true
            });

            // Validate query
            if (!query || typeof query !== 'string') {
                throw new Error('Invalid query provided');
            }

            const trimmedQuery = query.trim();
            if (!trimmedQuery) {
                throw new Error('Empty query provided');
            }

            if (!trimmedQuery.toLowerCase().startsWith('select')) {
                throw new Error('Only SELECT queries can be analyzed');
            }

            // Get execution plan
            let explainResult;
            try {
                const [rows] = await connection.query(`EXPLAIN ${trimmedQuery}`);
                explainResult = rows[0]; // EXPLAIN returns an array with one row
            } catch (error) {
                throw new Error(`Failed to get execution plan: ${error.message}`);
            }

            // Get table statistics
            let tableStats = [];
            try {
                [tableStats] = await connection.query(`
          SELECT 
            table_name,
            table_rows,
            data_length,
            index_length
          FROM information_schema.tables 
          WHERE table_schema = ?
        `, [this.config.database]);
            } catch (error) {
                logger.warn('Failed to get table statistics:', error.message);
            }

            // Get existing indexes
            let indexes = [];
            try {
                [indexes] = await connection.query(`
          SELECT 
            table_name,
            index_name,
            column_name,
            non_unique
          FROM information_schema.statistics 
          WHERE table_schema = ?
        `, [this.config.database]);
            } catch (error) {
                logger.warn('Failed to get index information:', error.message);
            }

            // Generate recommendations
            const recommendations = this.generateRecommendations(explainResult, tableStats, indexes);

            return {
                query: trimmedQuery,
                executionPlan: explainResult,
                tableStatistics: tableStats,
                indexes: indexes,
                recommendations: recommendations
            };

        } catch (error) {
            throw new Error(`MySQL Analysis Error: ${error.message}`);
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (error) {
                    logger.warn('Error closing connection:', error.message);
                }
            }
        }
    }

    generateRecommendations(explainResult, tableStats, indexes) {
        const recommendations = [];

        try {
            if (!explainResult) return recommendations;

            // 1. Analyze table access method
            this.analyzeTableAccessMethod(explainResult, recommendations);

            // 2. Analyze join operations
            this.analyzeJoinOperations(explainResult, recommendations);

            // 3. Analyze temporary tables and file sorts
            this.analyzeTemporaryStructures(explainResult, recommendations);

            // 4. Analyze index usage
            this.analyzeIndexUsage(explainResult, indexes, recommendations);

            // 5. Analyze table statistics
            this.analyzeTableStatistics(explainResult, tableStats, recommendations);

            // 6. Analyze query structure
            this.analyzeQueryStructure(explainResult, recommendations);

            // 7. Analyze partitioning
            this.analyzePartitioning(explainResult, recommendations);

            // 8. Analyze subqueries
            this.analyzeSubqueries(explainResult, recommendations);

            // 9. Analyze sorting operations
            this.analyzeSortOperations(explainResult, recommendations);

            // 10. Analyze group operations
            this.analyzeGroupOperations(explainResult, recommendations);

        } catch (error) {
            logger.warn(this.i18n.t('analyzer.errors.recommendations'), error.message);
        }

        return this.prioritizeRecommendations(recommendations);
    }

    analyzeTableAccessMethod(explainResult, recommendations) {
        // Check for full table scans
        if (explainResult.type === 'ALL') {
            const tableName = explainResult.table;
            recommendations.push({
                type: 'TABLE_SCAN',
                severity: 'HIGH',
                message: this.i18n.t('analyzer.recommendations.tableScan.message', { tableName }),
                suggestion: this.i18n.t('analyzer.recommendations.tableScan.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.tableScan.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.tableScan.implementation.review'),
                        this.i18n.t('analyzer.recommendations.tableScan.implementation.addIndexes'),
                        this.i18n.t('analyzer.recommendations.tableScan.implementation.coveringIndexes')
                    ]
                }
            });
        }

        // Check for poor access type
        if (['index', 'ALL'].includes(explainResult.type)) {
            recommendations.push({
                type: 'ACCESS_TYPE',
                severity: 'MEDIUM',
                message: this.i18n.t('analyzer.recommendations.accessType.message', { type: explainResult.type }),
                suggestion: this.i18n.t('analyzer.recommendations.accessType.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.accessType.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.accessType.implementation.review'),
                        this.i18n.t('analyzer.recommendations.accessType.implementation.indexCoverage'),
                        this.i18n.t('analyzer.recommendations.accessType.implementation.restructure')
                    ]
                }
            });
        }
    }

    analyzeJoinOperations(explainResult, recommendations) {
        // Check for inefficient joins
        if (explainResult.select_type !== 'SIMPLE' && !explainResult.key) {
            recommendations.push({
                type: 'JOIN_OPTIMIZATION',
                severity: 'HIGH',
                message: this.i18n.t('analyzer.recommendations.joinOptimization.message'),
                suggestion: this.i18n.t('analyzer.recommendations.joinOptimization.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.joinOptimization.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.joinOptimization.implementation.addIndexes'),
                        this.i18n.t('analyzer.recommendations.joinOptimization.implementation.reviewConditions'),
                        this.i18n.t('analyzer.recommendations.joinOptimization.implementation.denormalization')
                    ]
                }
            });
        }

        // Check for nested loop joins
        if (explainResult.Extra?.includes('Using join buffer')) {
            recommendations.push({
                type: 'JOIN_BUFFER',
                severity: 'MEDIUM',
                message: this.i18n.t('analyzer.recommendations.joinBuffer.message'),
                suggestion: this.i18n.t('analyzer.recommendations.joinBuffer.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.joinBuffer.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.joinBuffer.implementation.addIndexes'),
                        this.i18n.t('analyzer.recommendations.joinBuffer.implementation.reviewOrder'),
                        this.i18n.t('analyzer.recommendations.joinBuffer.implementation.bufferSize')
                    ]
                }
            });
        }
    }

    analyzeTemporaryStructures(explainResult, recommendations) {
        // Check for temporary tables
        if (explainResult.Extra?.includes('Using temporary')) {
            recommendations.push({
                type: 'TEMP_TABLE',
                severity: 'MEDIUM',
                message: this.i18n.t('analyzer.recommendations.tempTable.message'),
                suggestion: this.i18n.t('analyzer.recommendations.tempTable.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.tempTable.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.tempTable.implementation.review'),
                        this.i18n.t('analyzer.recommendations.tempTable.implementation.addIndexes'),
                        this.i18n.t('analyzer.recommendations.tempTable.implementation.restructure')
                    ]
                }
            });
        }

        // Check for file sorts
        if (explainResult.Extra?.includes('Using filesort')) {
            recommendations.push({
                type: 'FILE_SORT',
                severity: 'MEDIUM',
                message: this.i18n.t('analyzer.recommendations.fileSort.message'),
                suggestion: this.i18n.t('analyzer.recommendations.fileSort.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.fileSort.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.fileSort.implementation.addIndexes'),
                        this.i18n.t('analyzer.recommendations.fileSort.implementation.bufferSize'),
                        this.i18n.t('analyzer.recommendations.fileSort.implementation.limitResults')
                    ]
                }
            });
        }
    }

    analyzeIndexUsage(explainResult, indexes, recommendations) {
        // Check for unused indexes
        if (explainResult.possible_keys && !explainResult.key) {
            recommendations.push({
                type: 'UNUSED_INDEXES',
                severity: 'MEDIUM',
                message: this.i18n.t('analyzer.recommendations.unusedIndexes.message'),
                suggestion: this.i18n.t('analyzer.recommendations.unusedIndexes.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.unusedIndexes.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.unusedIndexes.implementation.analyze'),
                        this.i18n.t('analyzer.recommendations.unusedIndexes.implementation.review'),
                        this.i18n.t('analyzer.recommendations.unusedIndexes.implementation.forceIndex')
                    ]
                }
            });
        }

        // Check for partial index usage
        if (explainResult.key && explainResult.key_len && indexes.length > 0) {
            const relevantIndex = indexes.find(idx => idx.index_name === explainResult.key);
            if (relevantIndex && explainResult.ref !== 'const') {
                recommendations.push({
                    type: 'PARTIAL_INDEX_USAGE',
                    severity: 'LOW',
                    message: this.i18n.t('analyzer.recommendations.partialIndex.message'),
                    suggestion: this.i18n.t('analyzer.recommendations.partialIndex.suggestion'),
                    details: {
                        impact: this.i18n.t('analyzer.recommendations.partialIndex.impact'),
                        implementation: [
                            this.i18n.t('analyzer.recommendations.partialIndex.implementation.review'),
                            this.i18n.t('analyzer.recommendations.partialIndex.implementation.covering'),
                            this.i18n.t('analyzer.recommendations.partialIndex.implementation.analyze')
                        ]
                    }
                });
            }
        }
    }

    analyzeTableStatistics(explainResult, tableStats, recommendations) {
        if (!tableStats || !tableStats.length) return;

        const relevantTableStat = tableStats.find(stat => stat.table_name === explainResult.table);
        if (relevantTableStat) {
            // Check for large tables without proper indexing
            if (relevantTableStat.table_rows > 10000 && explainResult.type === 'ALL') {
                recommendations.push({
                    type: 'LARGE_TABLE_SCAN',
                    severity: 'HIGH',
                    message: this.i18n.t('analyzer.recommendations.largeTableScan.message', {
                        rows: relevantTableStat.table_rows
                    }),
                    suggestion: this.i18n.t('analyzer.recommendations.largeTableScan.suggestion'),
                    details: {
                        impact: this.i18n.t('analyzer.recommendations.largeTableScan.impact'),
                        implementation: [
                            this.i18n.t('analyzer.recommendations.largeTableScan.implementation.addIndexes'),
                            this.i18n.t('analyzer.recommendations.largeTableScan.implementation.partition'),
                            this.i18n.t('analyzer.recommendations.largeTableScan.implementation.optimize')
                        ]
                    }
                });
            }

            // Check index vs data size ratio
            const indexRatio = relevantTableStat.index_length / relevantTableStat.data_length;
            if (indexRatio > 0.5) {
                recommendations.push({
                    type: 'HIGH_INDEX_RATIO',
                    severity: 'LOW',
                    message: this.i18n.t('analyzer.recommendations.highIndexRatio.message'),
                    suggestion: this.i18n.t('analyzer.recommendations.highIndexRatio.suggestion'),
                    details: {
                        impact: this.i18n.t('analyzer.recommendations.highIndexRatio.impact'),
                        implementation: [
                            this.i18n.t('analyzer.recommendations.highIndexRatio.implementation.review'),
                            this.i18n.t('analyzer.recommendations.highIndexRatio.implementation.remove'),
                            this.i18n.t('analyzer.recommendations.highIndexRatio.implementation.covering')
                        ]
                    }
                });
            }
        }
    }

    analyzeQueryStructure(explainResult, recommendations) {
        // Check for inefficient WHERE clause handling
        if (explainResult.Extra?.includes('Using where')) {
            recommendations.push({
                type: 'WHERE_CLAUSE',
                severity: 'LOW',
                message: this.i18n.t('analyzer.recommendations.whereClause.message'),
                suggestion: this.i18n.t('analyzer.recommendations.whereClause.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.whereClause.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.whereClause.implementation.review'),
                        this.i18n.t('analyzer.recommendations.whereClause.implementation.addIndexes'),
                        this.i18n.t('analyzer.recommendations.whereClause.implementation.restructure')
                    ]
                }
            });
        }

        // Check for DISTINCT operations
        if (explainResult.Extra?.includes('Using temporary') && explainResult.Extra?.includes('Using filesort')) {
            recommendations.push({
                type: 'DISTINCT_OPTIMIZATION',
                severity: 'MEDIUM',
                message: this.i18n.t('analyzer.recommendations.distinct.message'),
                suggestion: this.i18n.t('analyzer.recommendations.distinct.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.distinct.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.distinct.implementation.groupBy'),
                        this.i18n.t('analyzer.recommendations.distinct.implementation.covering'),
                        this.i18n.t('analyzer.recommendations.distinct.implementation.review')
                    ]
                }
            });
        }
    }

    analyzePartitioning(explainResult, recommendations) {
        // Check for partition pruning
        if (explainResult.partitions && explainResult.partitions.includes(',')) {
            recommendations.push({
                type: 'PARTITION_PRUNING',
                severity: 'MEDIUM',
                message: this.i18n.t('analyzer.recommendations.partitioning.message'),
                suggestion: this.i18n.t('analyzer.recommendations.partitioning.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.partitioning.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.partitioning.implementation.review'),
                        this.i18n.t('analyzer.recommendations.partitioning.implementation.ensure'),
                        this.i18n.t('analyzer.recommendations.partitioning.implementation.consider')
                    ]
                }
            });
        }
    }

    analyzeSubqueries(explainResult, recommendations) {
        // Check for dependent subqueries
        if (explainResult.select_type === 'DEPENDENT SUBQUERY') {
            recommendations.push({
                type: 'DEPENDENT_SUBQUERY',
                severity: 'HIGH',
                message: this.i18n.t('analyzer.recommendations.dependentSubquery.message'),
                suggestion: this.i18n.t('analyzer.recommendations.dependentSubquery.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.dependentSubquery.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.dependentSubquery.implementation.join'),
                        this.i18n.t('analyzer.recommendations.dependentSubquery.implementation.rewrite'),
                        this.i18n.t('analyzer.recommendations.dependentSubquery.implementation.indexes')
                    ]
                }
            });
        }

        // Check for uncorrelated subqueries
        if (explainResult.select_type === 'SUBQUERY') {
            recommendations.push({
                type: 'SUBQUERY_OPTIMIZATION',
                severity: 'MEDIUM',
                message: this.i18n.t('analyzer.recommendations.subquery.message'),
                suggestion: this.i18n.t('analyzer.recommendations.subquery.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.subquery.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.subquery.implementation.join'),
                        this.i18n.t('analyzer.recommendations.subquery.implementation.rewrite'),
                        this.i18n.t('analyzer.recommendations.subquery.implementation.indexes'),
                        this.i18n.t('analyzer.recommendations.subquery.implementation.limit')
                    ]
                }
            });
        }
    }

    analyzeSortOperations(explainResult, recommendations) {
        // Check for filesorts with large result sets
        if (explainResult.Extra?.includes('Using filesort') && explainResult.rows > 1000) {
            recommendations.push({
                type: 'LARGE_SORT',
                severity: 'HIGH',
                message: this.i18n.t('analyzer.recommendations.largeSort.message', { rows: explainResult.rows }),
                suggestion: this.i18n.t('analyzer.recommendations.largeSort.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.largeSort.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.largeSort.implementation.indexSort'),
                        this.i18n.t('analyzer.recommendations.largeSort.implementation.limit'),
                        this.i18n.t('analyzer.recommendations.largeSort.implementation.buffer')
                    ]
                }
            });
        }

        // Check for multiple column sorts
        if (explainResult.Extra?.includes('Using filesort') && explainResult.key) {
            recommendations.push({
                type: 'MULTI_COLUMN_SORT',
                severity: 'MEDIUM',
                message: this.i18n.t('analyzer.recommendations.multiColumnSort.message'),
                suggestion: this.i18n.t('analyzer.recommendations.multiColumnSort.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.multiColumnSort.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.multiColumnSort.implementation.composite'),
                        this.i18n.t('analyzer.recommendations.multiColumnSort.implementation.order'),
                        this.i18n.t('analyzer.recommendations.multiColumnSort.implementation.review')
                    ]
                }
            });
        }
    }

    analyzeGroupOperations(explainResult, recommendations) {
        // Check for grouping without indexes
        if (explainResult.Extra?.includes('Using temporary') &&
            explainResult.Extra?.includes('Using filesort') &&
            !explainResult.key) {
            recommendations.push({
                type: 'GROUP_BY_OPTIMIZATION',
                severity: 'HIGH',
                message: this.i18n.t('analyzer.recommendations.groupBy.message'),
                suggestion: this.i18n.t('analyzer.recommendations.groupBy.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.groupBy.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.groupBy.implementation.index'),
                        this.i18n.t('analyzer.recommendations.groupBy.implementation.composite'),
                        this.i18n.t('analyzer.recommendations.groupBy.implementation.review')
                    ]
                }
            });
        }

        // Check for loose index scan opportunities
        if (explainResult.Extra?.includes('Using where') &&
            explainResult.Extra?.includes('Using temporary') &&
            explainResult.key) {
            recommendations.push({
                type: 'LOOSE_INDEX_SCAN',
                severity: 'MEDIUM',
                message: this.i18n.t('analyzer.recommendations.looseIndexScan.message'),
                suggestion: this.i18n.t('analyzer.recommendations.looseIndexScan.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.looseIndexScan.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.looseIndexScan.implementation.rewrite'),
                        this.i18n.t('analyzer.recommendations.looseIndexScan.implementation.index'),
                        this.i18n.t('analyzer.recommendations.looseIndexScan.implementation.min_max')
                    ]
                }
            });
        }
    }

    prioritizeRecommendations(recommendations) {
        // Define severity and type priorities
        const severityOrder = {
            HIGH: 0,
            MEDIUM: 1,
            LOW: 2
        };

        const priorityTypes = [
            'TABLE_SCAN',
            'JOIN_OPTIMIZATION',
            'LARGE_TABLE_SCAN',
            'DEPENDENT_SUBQUERY',
            'GROUP_BY_OPTIMIZATION',
            'LARGE_SORT'
        ];

        // Sort recommendations by severity and type
        return recommendations.sort((a, b) => {
            // First sort by severity
            if (severityOrder[a.severity] !== severityOrder[b.severity]) {
                return severityOrder[a.severity] - severityOrder[b.severity];
            }

            // Then sort by recommendation type priority
            const aTypePriority = priorityTypes.indexOf(a.type);
            const bTypePriority = priorityTypes.indexOf(b.type);

            if (aTypePriority !== bTypePriority) {
                return (aTypePriority === -1 ? Infinity : aTypePriority) -
                    (bTypePriority === -1 ? Infinity : bTypePriority);
            }

            // If same severity and priority, maintain stable sort
            return 0;
        });
    }
}

module.exports = MySQLAnalyzer;